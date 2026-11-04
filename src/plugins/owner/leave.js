export default {
  name: 'salir',
  aliases: ['leave'],
  category: 'owner',
  description: 'Hace que el bot salga del grupo actual',
  ownerOnly: true,
  groupOnly: true,

  async run(ctx) {
    await ctx.reply('👋 Hasta pronto.')
    await ctx.sock.groupLeave(ctx.jid)
  }
}
