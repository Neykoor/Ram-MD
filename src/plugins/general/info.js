import { arch, platform } from 'node:os'
import { formatBytes, formatDuration } from '../../lib/utils.js'

export default {
  name: 'info',
  aliases: ['botinfo', 'alive', 'estado'],
  category: 'general',
  description: 'Muestra el estado del bot',
  cooldown: 5,

  async run(ctx) {
    const { config, registry } = ctx
    const isTermux = String(process.env.PREFIX ?? '').includes('com.termux')
    const memory = process.memoryUsage()

    const lines = [
      `👑 *${config.bot.name}* v${config.pkg.version}`,
      '',
      `⏱️ Activa: *${formatDuration(process.uptime() * 1000)}*`,
      `📦 Comandos: *${registry.list.length}*`,
      `⌨️ Prefijos: *${config.prefixes.join('  ')}*`,
      `🔓 Modo: *${config.mode === 'owners' ? 'solo owners' : 'público'}*`,
      `🧠 RAM del bot: *${formatBytes(memory.rss)}*`,
      `🖥️ Sistema: *${isTermux ? 'Termux' : platform()} (${arch()})*`,
      `🟢 Node: *${process.version}*`,
      '',
      `_${config.bot.tagline}_`
    ]

    await ctx.reply(lines.join('\n'))
  }
}
