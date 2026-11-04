export default {
  bot: {
    name: 'Ram',
    tagline: 'La bot que viene a coronar 👑',
    footer: 'Ram • Hecha para Termux'
  },

  owners: [
    { name: 'Tu nombre', number: '5210000000000' }
  ],
  extraOwnerIds: [],

  number: process.env.BOT_NUMBER || '',

  prefixes: ['.', '!', '/'],
  mode: 'public',

  behavior: {
    allowPrivate: true,
    allowGroups: true,
    processOwnMessages: true,
    markCommandsAsRead: true,
    typingIndicator: true,
    replyUnknownCommand: false,
    maxMessageAgeSeconds: 120
  },

  cooldownSeconds: 3,

  session: {
    dir: 'sessions'
  },

  logLevel: 'silent',

  messages: {
    ownerOnly: '👑 Este comando es solo para el owner.',
    groupOnly: '👥 Este comando solo funciona en grupos.',
    privateOnly: '💬 Este comando solo funciona en chat privado.',
    adminOnly: '🛡️ Solo los admins del grupo pueden usar este comando.',
    botAdminOnly: '🤖 Necesito ser admin del grupo para hacer eso.',
    cooldown: '⏳ Espera {seconds}s antes de volver a usar este comando.',
    usage: '📌 Uso: {usage}',
    unknownCommand: '❓ No conozco ese comando. Usa {prefix}menu para ver la lista.',
    error: '❌ Ocurrió un error ejecutando el comando.'
  },

  menu: {
    image: '',
    header: [
      '╭━━━〔 👑 *{bot}* 〕━━━⬣',
      '┃ ✨ Hola, *{user}*',
      '┃ ⌨️ Prefijo: *{prefix}*',
      '┃ ⏱️ Activa: *{uptime}*',
      '┃ 📦 Comandos: *{total}*',
      '╰━━━━━━━━━━━━━━━⬣'
    ].join('\n'),
    categoryTitle: '╭──〔 {icon} *{category}* 〕',
    commandLine: '│ ◦ {prefix}{name}',
    categoryFooter: '╰───────────────⬣',
    footer: '_{tagline}_',
    categoryNames: {
      general: 'General',
      group: 'Grupos',
      owner: 'Owner'
    },
    icons: {
      general: '✨',
      group: '👥',
      owner: '👑'
    },
    defaultIcon: '📁'
  }
}
