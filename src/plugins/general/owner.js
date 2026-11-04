const buildCard = owner =>
  [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN:${owner.name}`,
    `TEL;type=CELL;type=VOICE;waid=${owner.number}:+${owner.number}`,
    'END:VCARD'
  ].join('\n')

export default {
  name: 'owner',
  aliases: ['creador', 'dueño'],
  category: 'general',
  description: 'Envía el contacto del owner',
  cooldown: 10,

  async run(ctx) {
    const owners = ctx.config.owners

    if (owners.length === 0) {
      await ctx.reply('👑 Este bot todavía no tiene un owner configurado.')
      return
    }

    await ctx.reply({
      contacts: {
        displayName: owners.length === 1 ? owners[0].name : 'Owners',
        contacts: owners.map(owner => ({ displayName: owner.name, vcard: buildCard(owner) }))
      }
    })
  }
}
