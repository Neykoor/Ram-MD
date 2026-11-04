import { access, readFile } from 'node:fs/promises'
import { isAbsolute, join } from 'node:path'
import { capitalize, formatDuration, render } from '../../lib/utils.js'

let imageCache = null

const loadImage = async (source, rootDir) => {
  if (!source) return null
  if (/^https?:\/\//i.test(source)) return { url: source }

  const path = isAbsolute(source) ? source : join(rootDir, source)
  if (imageCache?.path === path) return imageCache.value

  try {
    await access(path)
    const value = await readFile(path)
    imageCache = { path, value }
    return value
  } catch {
    return null
  }
}

const sortCategories = (categories, order) =>
  [...categories].sort((a, b) => {
    const ia = order.indexOf(a)
    const ib = order.indexOf(b)
    if (ia === -1 && ib === -1) return a.localeCompare(b)
    if (ia === -1) return 1
    if (ib === -1) return -1
    return ia - ib
  })

const buildMenu = ctx => {
  const { config, registry } = ctx
  const { menu, bot } = config

  const visible = registry.list.filter(command => !command.hidden && !(command.ownerOnly && !ctx.isOwner))
  const grouped = new Map()

  for (const command of visible) {
    if (!grouped.has(command.category)) grouped.set(command.category, [])
    grouped.get(command.category).push(command)
  }

  const vars = {
    bot: bot.name,
    tagline: bot.tagline,
    footer: bot.footer,
    user: ctx.pushName,
    prefix: ctx.prefix,
    uptime: formatDuration(process.uptime() * 1000),
    total: visible.length
  }

  const lines = [render(menu.header, vars), '']

  for (const category of sortCategories(grouped.keys(), Object.keys(menu.categoryNames))) {
    const title = menu.categoryNames[category] ?? capitalize(category)
    const icon = menu.icons[category] ?? menu.defaultIcon

    lines.push(render(menu.categoryTitle, { ...vars, icon, category: title }))

    const commands = grouped.get(category).sort((a, b) => a.name.localeCompare(b.name))
    for (const command of commands) {
      lines.push(render(menu.commandLine, { ...vars, name: command.name, description: command.description }))
    }

    if (menu.categoryFooter) lines.push(render(menu.categoryFooter, vars))
    lines.push('')
  }

  lines.push(render(menu.footer, vars))
  return lines.join('\n').trim()
}

export default {
  name: 'menu',
  aliases: ['help', 'ayuda', 'comandos'],
  category: 'general',
  description: 'Muestra la lista de comandos',
  cooldown: 5,

  async run(ctx) {
    const caption = buildMenu(ctx)
    const image = await loadImage(ctx.config.menu.image, ctx.config.rootDir)

    if (image) {
      try {
        await ctx.reply({ image, caption })
        return
      } catch {}
    }

    await ctx.reply(caption)
  }
}
