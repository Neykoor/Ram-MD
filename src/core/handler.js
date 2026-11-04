import { getMentions, getQuoted, getText } from '../lib/message.js'
import { isGroupJid, isIgnoredJid, jidUser, normalizeJid } from '../lib/jid.js'
import { createLru, render, toNumber } from '../lib/utils.js'
import config from './config.js'
import { createCooldowns } from './cooldowns.js'
import { log } from './logger.js'

const parseCommand = text => {
  const prefix = config.prefixes.find(candidate => text.startsWith(candidate))
  if (!prefix) return null

  const match = text.slice(prefix.length).match(/^\s*(\S+)\s*([\s\S]*)$/)
  if (!match) return null

  return { prefix, name: match[1].toLowerCase(), rest: match[2].trim() }
}

const participantMatches = (participant, ids) =>
  [participant.id, participant.lid, participant.phoneNumber]
    .filter(Boolean)
    .map(normalizeJid)
    .some(candidate => ids.includes(candidate))

const isAdminParticipant = participant =>
  Boolean(participant.admin) || participant.isAdmin === true || participant.isSuperAdmin === true

export const createMessageHandler = ({ registry, groups }) => {
  const cooldowns = createCooldowns()
  const seen = createLru(1000)
  const { behavior, messages } = config

  return sock => {
    const botIds = () => [sock.user?.id, sock.user?.lid].filter(Boolean).map(normalizeJid)

    const collectSenderIds = (key, isGroup) => {
      if (key.fromMe) return botIds()
      const candidates = isGroup ? [key.participantAlt, key.participant] : [key.remoteJidAlt, key.remoteJid]
      return candidates.filter(Boolean).map(normalizeJid)
    }

    const handleMessage = async msg => {
      const key = msg?.key
      if (!msg?.message || !key?.remoteJid || isIgnoredJid(key.remoteJid)) return

      const isGroup = isGroupJid(key.remoteJid)
      if (isGroup ? !behavior.allowGroups : !behavior.allowPrivate) return
      if (key.fromMe && !behavior.processOwnMessages) return

      const timestamp = toNumber(msg.messageTimestamp)
      if (timestamp && behavior.maxMessageAgeSeconds > 0 && Date.now() / 1000 - timestamp > behavior.maxMessageAgeSeconds) return

      const text = getText(msg.message)
      if (!text) return

      const parsed = parseCommand(text)
      if (!parsed) return

      const jid = key.remoteJidAlt || key.remoteJid
      const dedupeKey = `${key.remoteJid}:${key.id}`
      if (key.id) {
        if (seen.has(dedupeKey)) return
        seen.set(dedupeKey, true)
      }

      const senderIds = collectSenderIds(key, isGroup)
      const sender = senderIds.find(id => id.endsWith('@s.whatsapp.net')) ?? senderIds[0] ?? jid
      const isOwner = Boolean(key.fromMe) || senderIds.some(id => config.ownerIds.has(jidUser(id)))

      if (config.mode === 'owners' && !isOwner) return

      const send = (content, options = {}) =>
        sock.sendMessage(jid, typeof content === 'string' ? { text: content } : content, options)

      const reply = (content, options = {}) => send(content, { quoted: msg, ...options })

      const plugin = registry.get(parsed.name)

      if (!plugin) {
        if (behavior.replyUnknownCommand) {
          await reply(render(messages.unknownCommand, { prefix: parsed.prefix }))
        }
        return
      }

      const deny = text => reply(text)

      if (plugin.ownerOnly && !isOwner) return deny(messages.ownerOnly)
      if (plugin.groupOnly && !isGroup) return deny(messages.groupOnly)
      if (plugin.privateOnly && isGroup) return deny(messages.privateOnly)

      let adminState = null
      const resolveAdmins = async () => {
        if (!adminState) {
          adminState = groups.get(jid).then(meta => {
            const ids = senderIds
            const bots = botIds()
            const sourceParticipants = Array.isArray(meta?.participants) ? meta.participants : []
            const senderEntry = sourceParticipants.find(p => participantMatches(p, ids))
            const botEntry = sourceParticipants.find(p => participantMatches(p, bots))
            return {
              meta,
              isAdmin: Boolean(senderEntry && isAdminParticipant(senderEntry)),
              isBotAdmin: Boolean(botEntry && isAdminParticipant(botEntry))
            }
          })
          adminState.catch(() => {
            adminState = null
          })
        }
        return adminState
      }

      const needsAdminCheck = isGroup && ((plugin.adminOnly && !isOwner) || plugin.botAdminOnly)

      if (needsAdminCheck) {
        let state
        try {
          state = await resolveAdmins()
        } catch (error) {
          log.error(`No se pudo leer la información del grupo para "${plugin.name}"`, error)
          return deny(messages.error)
        }
        if (plugin.adminOnly && !isOwner && !state.isAdmin) return deny(messages.adminOnly)
        if (plugin.botAdminOnly && !state.isBotAdmin) return deny(messages.botAdminOnly)
      } else if ((plugin.adminOnly && !isGroup) || (plugin.botAdminOnly && !isGroup)) {
        return deny(messages.groupOnly)
      }

      if (!isOwner) {
        const seconds = plugin.cooldown ?? config.cooldownSeconds
        const result = cooldowns.check(`${jidUser(sender)}:${plugin.name}`, seconds)
        if (!result.allowed) {
          if (result.notify) await reply(render(messages.cooldown, { seconds: result.remaining }))
          return
        }
      }

      const ctx = {
        sock,
        msg,
        config,
        registry,
        jid,
        sender,
        senderIds,
        pushName: msg.pushName || jidUser(sender),
        isGroup,
        isOwner,
        fromMe: Boolean(key.fromMe),
        prefix: parsed.prefix,
        command: plugin.name,
        text: parsed.rest,
        args: parsed.rest ? parsed.rest.split(/\s+/) : [],
        quoted: getQuoted(msg.message),
        mentions: getMentions(msg.message),
        send,
        reply,
        react: emoji => sock.sendMessage(jid, { react: { text: emoji, key: msg.key } }),
        getGroup: async () => (isGroup ? (await resolveAdmins()).meta : null),
        isAdmin: async () => (isGroup ? (await resolveAdmins()).isAdmin : false),
        isBotAdmin: async () => (isGroup ? (await resolveAdmins()).isBotAdmin : false),
        usage: () => reply(render(messages.usage, { usage: `${parsed.prefix}${plugin.name} ${plugin.usage}`.trim() }))
      }

      if (behavior.markCommandsAsRead && !key.fromMe) {
        sock.readMessages([key]).catch(() => {})
      }

      if (behavior.typingIndicator) {
        sock.sendPresenceUpdate('composing', jid).catch(() => {})
      }

      try {
        await plugin.run(ctx)
      } catch (error) {
        log.error(`Error en el comando "${plugin.name}"`, error)
        await reply(messages.error).catch(() => {})
      } finally {
        if (behavior.typingIndicator) {
          sock.sendPresenceUpdate('paused', jid).catch(() => {})
        }
      }
    }

    return ({ messages: incoming, type }) => {
      if (type !== 'notify') return
      for (const msg of incoming) {
        handleMessage(msg).catch(error => log.error('Error procesando un mensaje', error))
      }
    }
  }
}
