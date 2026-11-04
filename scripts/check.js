import config, { getConfigWarnings } from '../src/core/config.js'
import { log, style } from '../src/core/logger.js'
import { loadPlugins } from '../src/core/plugin-loader.js'

const major = Number(process.versions.node.split('.')[0])
let problems = 0

console.log('')
console.log(`  ${style.bold(`👑 ${config.bot.name}`)} ${style.dim(`v${config.pkg.version}`)} ${style.dim('· revisión del proyecto')}`)
console.log('')

if (major < 20) {
  log.error(`Se necesita Node 20 o superior y tienes ${process.version}.`)
  problems += 1
} else {
  log.success(`Node ${process.version}`)
}

const baileys = config.pkg.dependencies?.baileys
if (baileys === 'npm:@neykoor/baileys@8.0.2-rc18') {
  log.success(`baileys → ${baileys}`)
} else {
  log.warn(`baileys en package.json es "${baileys}" y se esperaba "npm:@neykoor/baileys@8.0.2-rc18".`)
}

for (const warning of getConfigWarnings()) log.warn(warning)

log.info(`Prefijos: ${config.prefixes.join(' ')} · Modo: ${config.mode} · Owners: ${config.owners.length}`)

const registry = await loadPlugins()

for (const { file, error } of registry.errors) {
  log.error(`Plugin con errores: ${file}`, error)
  problems += 1
}

for (const warning of registry.warnings) log.warn(warning)

const byCategory = new Map()
for (const plugin of registry.list) {
  if (!byCategory.has(plugin.category)) byCategory.set(plugin.category, [])
  byCategory.get(plugin.category).push(plugin)
}

console.log('')
for (const [category, plugins] of byCategory) {
  console.log(`  ${style.cyan(category)} ${style.dim(`(${plugins.length})`)}`)
  for (const plugin of plugins) {
    const flags = [
      plugin.ownerOnly && 'owner',
      plugin.groupOnly && 'grupo',
      plugin.privateOnly && 'privado',
      plugin.adminOnly && 'admin',
      plugin.botAdminOnly && 'bot-admin'
    ].filter(Boolean)
    const aliases = plugin.aliases.length ? style.dim(` [${plugin.aliases.join(', ')}]`) : ''
    const marks = flags.length ? style.yellow(` · ${flags.join(' · ')}`) : ''
    console.log(`    ${plugin.name}${aliases}${marks}`)
  }
}
console.log('')

if (problems > 0) {
  log.error(`${problems} problema(s) encontrados.`)
  process.exit(1)
}

log.success(`Todo en orden: ${registry.list.length} comandos listos.`)
