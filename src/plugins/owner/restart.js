import { EXIT } from '../../core/exit-codes.js'
import { sleep } from '../../lib/utils.js'

export default {
  name: 'restart',
  aliases: ['reiniciar'],
  category: 'owner',
  description: 'Reinicia el bot',
  ownerOnly: true,

  async run(ctx) {
    await ctx.reply('♻️ Reiniciando...')
    await sleep(1000)
    process.exit(EXIT.RESTART)
  }
}
