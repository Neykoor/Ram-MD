export default {
  name: 'saludo',
  aliases: ['hola', 'hi'],
  category: 'general',
  description: 'Saluda al usuario',
  usage: '[nombre]',
  cooldown: 3,
  ownerOnly: false,
  groupOnly: false,
  privateOnly: false,
  adminOnly: false,
  botAdminOnly: false,
  hidden: false,

  async run(ctx) {
    const nombre = ctx.args[0] ?? ctx.pushName
    await ctx.reply(`👑 Hola, *${nombre}*. Soy ${ctx.config.bot.name}.`)
  }
}
