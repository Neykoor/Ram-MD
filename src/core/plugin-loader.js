import { readdir } from 'node:fs/promises'
import { basename, extname, join, relative, sep } from 'node:path'
import { pathToFileURL } from 'node:url'
import config from './config.js'

const NAME_PATTERN = /^[\p{L}\p{N}_-]+$/u

const walk = async dir => {
  const entries = await readdir(dir, { withFileTypes: true }).catch(() => [])
  const files = []

  for (const entry of entries) {
    if (entry.name.startsWith('_') || entry.name.startsWith('.')) continue
    const full = join(dir, entry.name)
    if (entry.isDirectory()) files.push(...(await walk(full)))
    else if (entry.isFile() && extname(entry.name) === '.js') files.push(full)
  }

  return files.sort()
}

const normalize = (module, file, dir) => {
  const plugin = module?.default
  if (!plugin || typeof plugin !== 'object') {
    throw new Error('debe exportar un objeto con "export default { ... }"')
  }
  if (typeof plugin.run !== 'function') {
    throw new Error('le falta la función run(ctx)')
  }

  const name = String(plugin.name ?? basename(file, '.js')).trim().toLowerCase()
  if (!NAME_PATTERN.test(name)) {
    throw new Error(`el nombre "${name}" no es válido (usa letras, números, guion o guion bajo)`)
  }

  const folder = relative(dir, file).split(sep)
  const category = String(plugin.category ?? (folder.length > 1 ? folder[0] : 'general')).trim().toLowerCase() || 'general'

  const aliases = [
    ...new Set(
      (Array.isArray(plugin.aliases) ? plugin.aliases : [])
        .map(alias => String(alias).trim().toLowerCase())
        .filter(alias => alias && alias !== name && NAME_PATTERN.test(alias))
    )
  ]

  const cooldown = Number(plugin.cooldown)

  return Object.freeze({
    name,
    aliases,
    category,
    description: String(plugin.description ?? ''),
    usage: String(plugin.usage ?? ''),
    cooldown: Number.isFinite(cooldown) && cooldown >= 0 ? cooldown : undefined,
    ownerOnly: Boolean(plugin.ownerOnly),
    groupOnly: Boolean(plugin.groupOnly),
    privateOnly: Boolean(plugin.privateOnly),
    adminOnly: Boolean(plugin.adminOnly),
    botAdminOnly: Boolean(plugin.botAdminOnly),
    hidden: Boolean(plugin.hidden),
    run: plugin.run,
    file: relative(dir, file).split(sep).join('/')
  })
}

export const loadPlugins = async (dir = config.pluginsDir) => {
  const files = await walk(dir)
  const errors = []
  const warnings = []
  const loaded = []

  for (const file of files) {
    try {
      const module = await import(pathToFileURL(file).href)
      loaded.push(normalize(module, file, dir))
    } catch (error) {
      errors.push({ file: relative(dir, file).split(sep).join('/'), error })
    }
  }

  const commands = new Map()
  const list = []

  for (const plugin of loaded) {
    const existing = commands.get(plugin.name)
    if (existing) {
      errors.push({
        file: plugin.file,
        error: new Error(`el comando "${plugin.name}" ya existe en ${existing.file}`)
      })
      continue
    }
    commands.set(plugin.name, plugin)
    list.push(plugin)
  }

  for (const plugin of list) {
    for (const alias of plugin.aliases) {
      const existing = commands.get(alias)
      if (existing && existing !== plugin) {
        warnings.push(`${plugin.file}: el alias "${alias}" ya lo usa "${existing.name}" y se ignoró`)
        continue
      }
      commands.set(alias, plugin)
    }
  }

  return {
    commands,
    list,
    errors,
    warnings,
    get: name => commands.get(String(name).toLowerCase())
  }
}
