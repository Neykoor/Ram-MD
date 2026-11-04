import { rm } from 'node:fs/promises'
import { createInterface } from 'node:readline/promises'
import makeWASocket, {
  Browsers,
  DisconnectReason,
  makeCacheableSignalKeyStore,
  useMultiFileAuthState
} from 'baileys'
import { createLru, digits } from '../lib/utils.js'
import { jidUser } from '../lib/jid.js'
import config from './config.js'
import { EXIT } from './exit-codes.js'
import { baileysLogger, log, style } from './logger.js'

const MAX_PAIRING_ATTEMPTS = 5
const MAX_START_FAILURES = 10
const MAX_BACKOFF_MS = 30_000

class FatalError extends Error {}

export const createConnection = ({ attachMessages, groups }) => {
  const sentMessages = createLru(300)

  let sock = null
  let reconnectTimer = null
  let attempts = 0
  let pairingAttempts = 0
  let pairingNumber = config.number
  let stopping = false

  const fatal = message => {
    log.error(message)
    stopping = true
    clearTimeout(reconnectTimer)
    process.exit(EXIT.FATAL)
  }

  const resolveNumber = async () => {
    if (pairingNumber) return pairingNumber

    if (!process.stdin.isTTY) {
      throw new FatalError('No hay número configurado y no hay una terminal interactiva. Define "number" en settings.js o la variable BOT_NUMBER.')
    }

    const rl = createInterface({ input: process.stdin, output: process.stdout })
    const closed = new Promise((_, reject) => rl.once('close', () => reject(new FatalError('Se cerró la entrada antes de escribir el número.'))))
    closed.catch(() => {})

    try {
      for (;;) {
        const answer = digits(await Promise.race([rl.question(`\n📱 Número del bot con código de país (ej. 5215512345678): `), closed]))
        if (answer.length >= 8 && answer.length <= 15) {
          pairingNumber = answer
          return answer
        }
        console.log('Número inválido: usa solo dígitos, con código de país, sin + ni espacios.')
      }
    } finally {
      rl.close()
    }
  }

  const showPairingCode = code => {
    const formatted = String(code).match(/.{1,4}/g)?.join('-') ?? String(code)
    console.log('')
    console.log(`  ${style.bold('🔐 CÓDIGO DE VINCULACIÓN')}`)
    console.log(`  ${style.magenta(style.bold(formatted))}`)
    console.log('')
    console.log(style.dim('  WhatsApp → Dispositivos vinculados → Vincular con el número de teléfono'))
    console.log(style.dim('  Escribe el código antes de que expire.'))
    console.log('')
  }

  const requestPairing = async target => {
    pairingAttempts += 1
    if (pairingAttempts > MAX_PAIRING_ATTEMPTS) {
      throw new FatalError('La vinculación no se completó después de varios intentos. Ejecuta npm start para intentarlo de nuevo.')
    }

    const number = await resolveNumber()
    const code = await target.requestPairingCode(number)
    if (target === sock && !stopping) showPairingCode(code)
  }

  const trackSentMessages = target => {
    const original = target.sendMessage.bind(target)
    target.sendMessage = async (...args) => {
      const sent = await original(...args)
      if (sent?.key?.id && sent.message) sentMessages.set(sent.key.id, sent.message)
      return sent
    }
  }

  const backoff = () => Math.min(1000 * 2 ** (attempts - 1), MAX_BACKOFF_MS)

  const schedule = delay => {
    if (stopping || reconnectTimer) return
    reconnectTimer = setTimeout(() => {
      reconnectTimer = null
      begin().catch(handleStartFailure)
    }, delay)
  }

  const handleStartFailure = error => {
    if (error instanceof FatalError) return fatal(error.message)
    attempts += 1
    if (attempts > MAX_START_FAILURES) {
      return fatal('No se pudo iniciar la conexión después de varios intentos. Revisa el error anterior.')
    }
    log.error('No se pudo iniciar la conexión', error)
    schedule(backoff())
  }

  const handleClose = async error => {
    if (stopping) return

    const code = error?.output?.statusCode ?? error?.statusCode
    const reason = error?.message || 'sin detalle'

    if (code === DisconnectReason.loggedOut) {
      log.warn('WhatsApp cerró la sesión. Se borrará la sesión local y tendrás que vincular de nuevo.')
      await rm(config.sessionDir, { recursive: true, force: true }).catch(() => {})
      attempts = 0
      pairingAttempts = 0
      pairingNumber = config.number
      return schedule(1000)
    }

    if (code === DisconnectReason.connectionReplaced) {
      return fatal('La conexión fue reemplazada: esta cuenta se abrió en otra sesión del bot.')
    }

    if (code === DisconnectReason.forbidden) {
      return fatal('WhatsApp rechazó la conexión (403). Revisa el estado de la cuenta antes de volver a intentar.')
    }

    if (code === DisconnectReason.restartRequired) {
      log.info('Reiniciando la conexión...')
      return schedule(0)
    }

    attempts += 1
    const delay = backoff()
    log.warn(`Conexión cerrada (${code ?? 'sin código'}: ${reason}). Reintentando en ${Math.round(delay / 1000)}s...`)
    schedule(delay)
  }

  const handleOpen = target => {
    attempts = 0
    pairingAttempts = 0
    const id = jidUser(target.user?.id)
    log.success(`Conectada a WhatsApp${id ? ` como ${id}` : ''}.`)
  }

  const begin = async () => {
    const { state, saveCreds } = await useMultiFileAuthState(config.sessionDir)
    const needsPairing = !state.creds.registered

    if (needsPairing) {
      try {
        await resolveNumber()
      } catch (error) {
        throw error instanceof FatalError ? error : new FatalError(error.message)
      }
    }

    const target = makeWASocket({
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, baileysLogger)
      },
      logger: baileysLogger,
      browser: Browsers.ubuntu('Chrome'),
      markOnlineOnConnect: false,
      syncFullHistory: false,
      generateHighQualityLinkPreview: false,
      cachedGroupMetadata: async jid => groups.peek(jid),
      getMessage: async key => (key?.id ? sentMessages.get(key.id) : undefined)
    })

    sock = target
    trackSentMessages(target)
    groups.attach(target)

    target.ev.on('creds.update', () => {
      saveCreds().catch(error => log.error('No se pudieron guardar las credenciales', error))
    })

    target.ev.on('connection.update', update => {
      if (target !== sock) return
      if (update.connection === 'open') handleOpen(target)
      if (update.connection === 'close') {
        handleClose(update.lastDisconnect?.error).catch(error => log.error('Error manejando el cierre de conexión', error))
      }
    })

    target.ev.on('messages.upsert', attachMessages(target))

    if (needsPairing) {
      requestPairing(target).catch(error => {
        if (error instanceof FatalError) return fatal(error.message)
        if (stopping || target !== sock) return
        log.error('No se pudo pedir el código de vinculación', error)
      })
    }
  }

  const start = async () => {
    try {
      await begin()
    } catch (error) {
      if (error instanceof FatalError) return fatal(error.message)
      throw error
    }
  }

  const stop = async () => {
    stopping = true
    clearTimeout(reconnectTimer)
    reconnectTimer = null
    try {
      sock?.end(undefined)
    } catch {}
  }

  return { start, stop }
}
