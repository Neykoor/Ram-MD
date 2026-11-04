import { formatDate } from '../../lib/utils.js'

export default {
  name: 'infogrupo',
  aliases: ['groupinfo', 'gp'],
  category: 'group',
  description: 'Muestra la información del grupo',
  groupOnly: true,
  cooldown: 10,

  async run(ctx) {
    const meta = await ctx.getGroup()
    const participants = meta.participants ?? []
    const admins = participants.filter(p => p.admin || p.isAdmin || p.isSuperAdmin).length

    const lines = [
      `👥 *${meta.subject}*`,
      '',
      `🆔 ${meta.id}`,
      `📅 Creado: ${meta.creation ? formatDate(meta.creation * 1000) : '—'}`,
      `👤 Miembros: *${participants.length}*`,
      `🛡️ Admins: *${admins}*`,
      `💬 Escriben: *${meta.announce ? 'solo admins' : 'todos'}*`,
      `⚙️ Editan info: *${meta.restrict ? 'solo admins' : 'todos'}*`
    ]

    if (meta.desc) lines.push('', `📝 ${meta.desc}`)

    await ctx.reply(lines.join('\n'))
  }
}
