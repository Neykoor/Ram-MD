import { arch, platform } from 'node:os'
import config, { getConfigWarnings } from './core/config.js'
import { EXIT } from './core/exit-codes.js'
import { createGroupCache } from './core/group-cache.js'
import { log, style } from './core/logger.js'
import { loadPlugins } from './core/plugin-loader.js'

const printBanner = () => {
  console.log('')
  console.log(`  ${style.magenta(style.bold(`👑 ${config.bot.name.toUpperCase()}`))} ${style.dim(`v${config.pkg.version}`)}`)
  console.log(`  ${config.bot.tagline}`)
  console.log(style.dim(`  Node ${process.version} · ${platform()} ${arch()}`))
  console.log('')
}

const loadRuntime = async () => {
  try {
    const [connection, handler] = await Promise.all([
      import('./core/connection.js'),
      import('./core/handler.js')
    ])
    return { createConnection: connection.createConnection, createMessageHandler: handler.createMessageHandler }
  } catch (error) {
    if (error?.code === 'ERR_MODULE_NOT_FOUND') {
      log.error('Faltan dependencias. Ejecuta "npm install" dentro de la carpeta del bot y vuelve a iniciar.', error)
      process.exit(EXIT.FATAL)
    }
    throw error
  }
}

process.on('unhandledRejection', reason => log.error('Promesa rechazada sin manejar', reason))

process.on('uncaughtException', error => {
  log.error('Excepción no controlada', error)
  process.exit(1)
})

printBanner()

for (const warning of getConfigWarnings()) log.warn(warning)

const registry = await loadPlugins()
for (const { file, error } of registry.errors) log.error(`No se pudo cargar el plugin ${file}`, error)
for (const warning of registry.warnings) log.warn(warning)

if (registry.list.length === 0) {
  log.warn('No se cargó ningún comando. Revisa la carpeta src/plugins.')
} else {
  log.info(`${registry.list.length} comandos cargados.`)
}

const { createConnection, createMessageHandler } = await loadRuntime()

const groups = createGroupCache()
const attachMessages = createMessageHandler({ registry, groups })
const connection = createConnection({ attachMessages, groups })

let closing = false

const shutdown = async signal => {
  if (closing) return
  closing = true
  log.info(`Apagando (${signal})...`)
  setTimeout(() => process.exit(EXIT.OK), 4000).unref()
  await connection.stop()
  process.exit(EXIT.OK)
}

process.on('SIGINT', () => shutdown('SIGINT'))
process.on('SIGTERM', () => shutdown('SIGTERM'))

try {
  await connection.start()
} catch (error) {
  log.error('No se pudo iniciar el bot', error)
  process.exit(1)
}
