export default {
  name: 'id',
  aliases: ['miid', 'myid'],
  category: 'general',
  description: 'Muestra tus identificadores y el del chat',
  cooldown: 5,

  async run(ctx) {
    const lines = [
      '🆔 *Identificadores*',
      '',
      `💬 Chat: ${ctx.jid}`,
      ...ctx.senderIds.map(id => `👤 Tú: ${id}`),
      '',
      '_Si eres owner y el bot no te reconoce, agrega el número de tu identificador @lid en "extraOwnerIds" dentro de settings.js._'
    ]

    await ctx.reply(lines.join('\n'))
  }
}
