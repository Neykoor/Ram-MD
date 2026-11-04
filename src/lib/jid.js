import { digits } from './utils.js'

export const normalizeJid = jid => {
  if (!jid || typeof jid !== 'string') return ''
  const [user, server] = jid.split('@')
  if (!server) return jid
  return `${user.split(':')[0]}@${server}`
}

export const jidUser = jid => {
  if (!jid || typeof jid !== 'string') return ''
  return jid.split('@')[0].split(':')[0]
}

export const isGroupJid = jid => typeof jid === 'string' && jid.endsWith('@g.us')

export const isIgnoredJid = jid =>
  typeof jid !== 'string' ||
  jid === 'status@broadcast' ||
  jid.endsWith('@broadcast') ||
  jid.endsWith('@newsletter')

export const toUserJid = number => `${digits(number)}@s.whatsapp.net`
