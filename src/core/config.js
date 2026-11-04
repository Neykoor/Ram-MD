import { readFileSync } from 'node:fs'
import { dirname, isAbsolute, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import settings from '../../settings.js'
import { digits } from '../lib/utils.js'

export const ROOT_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')
export const PLACEHOLDER_OWNER = '5210000000000'

const DEFAULTS = {
  bot: {
    name: 'Ram',
    tagline: 'La bot que viene a coronar 👑',
    footer: 'Ram • Hecha para Termux'
  },
  owners: [],
  extraOwnerIds: [],
  number: '',
  prefixes: ['.'],
  mode: 'public',
  behavior: {
    allowPrivate: true,
    allowGroups: true,
    processOwnMessages: true,
    markCommandsAsRead: true,
    typingIndicator: true,
    replyUnknownCommand: false,
    maxMessageAgeSeconds: 120
  },
  cooldownSeconds: 3,
  session: { dir: 'sessions' },
  logLevel: 'silent',
  messages: {
    ownerOnly: '👑 Este comando es solo para el owner.',
    groupOnly: '👥 Este comando solo funciona en grupos.',
    privateOnly: '💬 Este comando solo funciona en chat privado.',
    adminOnly: '🛡️ Solo los admins del grupo pueden usar este comando.',
    botAdminOnly: '🤖 Necesito ser admin del grupo para hacer eso.',
    cooldown: '⏳ Espera {seconds}s antes de volver a usar este comando.',
    usage: '📌 Uso: {usage}',
    unknownCommand: '❓ No conozco ese comando. Usa {prefix}menu para ver la lista.',
    error: '❌ Ocurrió un error ejecutando el comando.'
  },
  menu: {
    image: '',
    header: '👑 *{bot}*\n⌨️ Prefijo: *{prefix}*\n📦 Comandos: *{total}*',
    categoryTitle: '*{icon} {category}*',
    commandLine: '• {prefix}{name}',
    categoryFooter: '',
    footer: '_{tagline}_',
    categoryNames: {},
    icons: {},
    defaultIcon: '📁'
  }
}

const isPlainObject = value => value !== null && typeof value === 'object' && !Array.isArray(value)

const merge = (base, override) => {
  if (!isPlainObject(override)) return base
  const result = { ...base }
  for (const [key, value] of Object.entries(override)) {
    if (value === undefined) continue
    result[key] = isPlainObject(base[key]) && isPlainObject(value) ? merge(base[key], value) : value
  }
  return result
}

const readPackage = () => {
  try {
    return JSON.parse(readFileSync(join(ROOT_DIR, 'package.json'), 'utf8'))
  } catch {
    return { name: 'ram-bot', version: '0.0.0' }
  }
}

const normalizeOwners = owners =>
  (Array.isArray(owners) ? owners : [])
    .map(owner => (typeof owner === 'string' ? { name: 'Owner', number: owner } : owner))
    .filter(isPlainObject)
    .map(owner => ({ name: String(owner.name || 'Owner'), number: digits(owner.number) }))
    .filter(owner => owner.number.length > 0)

const normalizePrefixes = prefixes => {
  const list = (Array.isArray(prefixes) ? prefixes : [prefixes])
    .filter(prefix => typeof prefix === 'string' && prefix.length > 0)
  const unique = [...new Set(list)]
  return (unique.length ? unique : DEFAULTS.prefixes).sort((a, b) => b.length - a.length)
}

const build = () => {
  const merged = merge(DEFAULTS, settings)
  const owners = normalizeOwners(merged.owners)
  const extraIds = (Array.isArray(merged.extraOwnerIds) ? merged.extraOwnerIds : []).map(digits).filter(Boolean)
  const sessionDir = String(merged.session.dir || 'sessions')

  return Object.freeze({
    ...merged,
    owners,
    ownerIds: new Set([...owners.map(owner => owner.number), ...extraIds]),
    number: digits(merged.number),
    prefixes: normalizePrefixes(merged.prefixes),
    mode: merged.mode === 'owners' ? 'owners' : 'public',
    cooldownSeconds: Math.max(0, Number(merged.cooldownSeconds) || 0),
    behavior: Object.freeze({
      ...merged.behavior,
      maxMessageAgeSeconds: Math.max(0, Number(merged.behavior.maxMessageAgeSeconds) || 0)
    }),
    sessionDir: isAbsolute(sessionDir) ? sessionDir : join(ROOT_DIR, sessionDir),
    pluginsDir: join(ROOT_DIR, 'src', 'plugins'),
    rootDir: ROOT_DIR,
    pkg: readPackage()
  })
}

const config = build()

export const getConfigWarnings = () => {
  const warnings = []
  if (config.owners.length === 0 && config.ownerIds.size === 0) {
    warnings.push('No hay owners configurados en settings.js; los comandos de owner no funcionarán.')
  }
  if (config.owners.some(owner => owner.number === PLACEHOLDER_OWNER)) {
    warnings.push(`El owner sigue con el número de ejemplo (${PLACEHOLDER_OWNER}). Cámbialo en settings.js.`)
  }
  return warnings
}

export default config
