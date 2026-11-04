export default {
  name: 'hidetag',
  aliases: ['notificar', 'n'],
  category: 'group',
  description: 'Envía un mensaje que notifica a todos sin mostrar las menciones',
  usage: '<mensaje> (o responde a un mensaje)',
  groupOnly: true,
  adminOnly: true,
  cooldown: 15,

  async run(ctx) {
    const text = ctx.text || ctx.quoted?.text
    if (!text) {
      await ctx.usage()
      return
    }

    const meta = await ctx.getGroup()
    const mentions = meta.participants.map(participant => participant.phoneNumber || participant.id)

    await ctx.send({ text, mentions })
  }
}
