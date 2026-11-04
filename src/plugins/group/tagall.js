import { jidUser } from '../../lib/jid.js'

export default {
  name: 'tagall',
  aliases: ['todos', 'invocar'],
  category: 'group',
  description: 'Menciona a todos los miembros del grupo',
  usage: '[mensaje]',
  groupOnly: true,
  adminOnly: true,
  cooldown: 30,

  async run(ctx) {
    const meta = await ctx.getGroup()
    const jids = meta.participants.map(participant => participant.phoneNumber || participant.id)

    const title = ctx.text ? `📢 *${ctx.text}*` : '📢 *Atención a todos*'
    const body = jids.map(jid => `◦ @${jidUser(jid)}`).join('\n')

    await ctx.send({ text: `${title}\n\n${body}`, mentions: jids }, { quoted: ctx.msg })
  }
}
