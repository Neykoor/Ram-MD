export default {
  name: 'ping',
  aliases: ['p'],
  category: 'general',
  description: 'Mide la latencia del bot',

  async run(ctx) {
    const start = Date.now()
    const sent = await ctx.reply('🏓 Pong...')
    const latency = Date.now() - start

    if (!sent?.key) return

    try {
      await ctx.sock.sendMessage(ctx.jid, { text: `🏓 Pong! *${latency} ms*`, edit: sent.key })
    } catch {
      await ctx.send(`🏓 Latencia: *${latency} ms*`)
    }
  }
}
