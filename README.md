<div align="center">

<img src="./assets/banner.png" alt="Ram Bot" width="100%" />



Base profesional para bots de **WhatsApp** pensada para **Termux**.<br>
Fácil de personalizar, organizada por plugins y lista para crecer.

[![Node](https://img.shields.io/badge/Node-%3E%3D20-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Baileys](https://img.shields.io/badge/baileys-%40neykoor%2Fbaileys%408.0.2--rc18-ff4fa3)](https://github.com/Neykoor/BaileysX)
[![Termux](https://img.shields.io/badge/Termux-Android-000000?logo=android&logoColor=3DDC84)](https://termux.dev/)
[![ESM](https://img.shields.io/badge/Módulos-ESM-f7df1e?logo=javascript&logoColor=black)](https://nodejs.org/api/esm.html)
[![Licencia](https://img.shields.io/badge/Licencia-MIT-blue)](./LICENSE)

</div>

---

## 📖 Contenido

- [✨ Características](#-características)
- [📋 Requisitos](#-requisitos)
- [📱 Instalación en Termux](#-instalación-en-termux)
- [🔗 Primer inicio y vinculación](#-primer-inicio-y-vinculación)
- [⚙️ Personalización](#️-personalización)
- [🧩 Crear tus propios comandos](#-crear-tus-propios-comandos)
- [🧰 Comandos incluidos](#-comandos-incluidos)
- [🗂️ Estructura del proyecto](#️-estructura-del-proyecto)
- [🛠️ Solución de problemas](#️-solución-de-problemas)
- [🤝 Créditos](#-créditos)

---

## ✨ Características

- 👑 **Todo se personaliza desde un solo archivo**: `settings.js` controla nombre, prefijos, owners, mensajes y el diseño del menú.
- 🧩 **Un comando = un archivo**: los plugins se cargan solos desde `src/plugins`, agrupados por carpeta (la carpeta es la categoría).
- 🔐 **Vinculación por código** de 8 caracteres, sin QR, ideal para usar el bot desde el mismo teléfono.
- 🔄 **Reconexión inteligente** con espera progresiva, manejo de sesión cerrada y supervisor que reinicia el bot si falla.
- 🛡️ **Permisos listos**: `ownerOnly`, `groupOnly`, `privateOnly`, `adminOnly` y `botAdminOnly` por comando.
- ⏳ **Anti-spam**: cooldown por usuario y comando, con un solo aviso por ventana.
- 📜 **Menú automático** generado a partir de los plugins instalados, con plantillas editables.
- ⚡ **Ligera**: pocas dependencias, caché de metadatos de grupo y de mensajes enviados para los reintentos.
- ✅ **`npm run check`** valida tu configuración y tus plugins sin conectarte a WhatsApp.

---

## 📋 Requisitos

| Requisito | Detalle |
|---|---|
| Android con **Termux** | Instálalo desde [F-Droid](https://f-droid.org/packages/com.termux/) o desde los [releases oficiales](https://github.com/termux/termux-app/releases) |
| **Node.js 20 o superior** | Se instala con `nodejs-lts` |
| **Git** | Opcional, solo si clonas el repositorio |
| Una cuenta de **WhatsApp** | Con el número que usará el bot |

---

## 📱 Instalación en Termux

**1. Prepara Termux**

```bash
pkg update -y && pkg upgrade -y
pkg install -y nodejs-lts git
```

**2. Descarga el proyecto**

Con Git:

```bash
git clone https://github.com/TU-USUARIO/Ram-Bot.git
cd Ram-Bot
```

**3. Instala las dependencias**

```bash
npm install
```

> 💡 También puedes ejecutar todo el paso 1 y 3 de una vez con `bash scripts/termux-setup.sh`.

**4. Revisa que todo esté en orden**

```bash
npm run check
```

---

## 🔗 Primer inicio y vinculación

```bash
npm start
```

1. El bot te pedirá el **número** con código de país, sin `+` ni espacios (por ejemplo `5215512345678`).
2. Aparecerá un **código** parecido a `ABCD-1234`.
3. En WhatsApp abre **Dispositivos vinculados → Vincular un dispositivo → Vincular con el número de teléfono** y escribe el código.
4. Cuando veas `Conectada a WhatsApp`, envía `.menu` y la corona es tuya 👑

Para no escribir el número cada vez, ponlo en `settings.js` (`number`) o inícialo así:

```bash
BOT_NUMBER=5215512345678 npm start
```

**Mantenerla activa en segundo plano**

```bash
pkg install -y tmux
termux-wake-lock
tmux new -s ram
npm start
```

Para salir de `tmux` sin apagar el bot pulsa `Ctrl + B` y luego `D`. Para volver: `tmux attach -t ram`.

---

## ⚙️ Personalización

Todo lo que normalmente querrás cambiar está en **`settings.js`**. Si borras una opción, el bot usa su valor por defecto.

### Identidad y acceso

| Opción | Qué hace |
|---|---|
| `bot.name` | Nombre del bot en menús y mensajes |
| `bot.tagline` | Frase que aparece al pie del menú |
| `bot.footer` | Texto secundario disponible como `{footer}` |
| `owners` | Lista de owners: `{ name, number }` (número con código de país, sin `+`) |
| `extraOwnerIds` | Identificadores adicionales de owner (por ejemplo un `@lid`, mira el comando `.id`) |
| `number` | Número del bot para vincular sin que lo pregunte |
| `prefixes` | Prefijos de comandos, por ejemplo `['.', '!', '/']` |
| `mode` | `'public'` responde a todos, `'owners'` solo a los owners |

### Comportamiento

| Opción | Qué hace |
|---|---|
| `behavior.allowPrivate` | Responder en chats privados |
| `behavior.allowGroups` | Responder en grupos |
| `behavior.processOwnMessages` | Aceptar comandos escritos desde el propio número del bot |
| `behavior.markCommandsAsRead` | Marcar como leídos los mensajes que son comandos |
| `behavior.typingIndicator` | Mostrar «escribiendo…» mientras se ejecuta un comando |
| `behavior.replyUnknownCommand` | Avisar cuando el comando no existe |
| `behavior.maxMessageAgeSeconds` | Ignorar mensajes más viejos que esto (`0` desactiva el filtro) |
| `cooldownSeconds` | Espera por defecto entre usos del mismo comando |
| `session.dir` | Carpeta donde se guarda la sesión |
| `logLevel` | Nivel de logs de Baileys: `silent`, `error`, `warn`, `info`, `debug` |

### Mensajes

En `messages` puedes cambiar los textos de error y de permisos. Admiten variables entre llaves:

| Mensaje | Variables |
|---|---|
| `cooldown` | `{seconds}` |
| `usage` | `{usage}` |
| `unknownCommand` | `{prefix}` |

### Menú

El menú se arma con plantillas en `menu`:

| Opción | Qué hace |
|---|---|
| `menu.image` | Imagen del menú: una URL `https://…` o una ruta como `assets/menu.jpg`. Vacío = solo texto |
| `menu.header` | Encabezado del menú |
| `menu.categoryTitle` | Título de cada categoría |
| `menu.commandLine` | Línea de cada comando |
| `menu.categoryFooter` | Cierre de cada categoría |
| `menu.footer` | Pie del menú |
| `menu.categoryNames` | Nombre visible de cada categoría y su orden |
| `menu.icons` | Icono de cada categoría |

Variables disponibles: `{bot}`, `{user}`, `{prefix}`, `{uptime}`, `{total}`, `{tagline}`, `{footer}`, `{icon}`, `{category}`, `{name}` y `{description}`.

Las categorías nuevas aparecen solas en el menú; si quieres un nombre o un icono propio, agrégalos en `categoryNames` e `icons`.

---

## 🧩 Crear tus propios comandos

Crea un archivo `.js` dentro de `src/plugins/<categoría>/`. La carpeta define la categoría y el bot lo carga al iniciar. Puedes partir de `src/plugins/_plantilla.js` (los archivos que empiezan con `_` se ignoran).

```js
export default {
  name: 'dado',
  aliases: ['dice', 'd6'],
  category: 'general',
  description: 'Lanza un dado',
  usage: '[caras]',
  cooldown: 3,

  async run(ctx) {
    const caras = Math.min(Math.max(parseInt(ctx.args[0], 10) || 6, 2), 1000)
    const resultado = 1 + Math.floor(Math.random() * caras)
    await ctx.reply(`🎲 Salió *${resultado}* (de ${caras})`)
  }
}
```

Guárdalo como `src/plugins/general/dado.js`, reinicia el bot y usa `.dado`.

### Propiedades de un plugin

| Propiedad | Tipo | Descripción |
|---|---|---|
| `name` | `string` | Nombre del comando (si falta, se usa el nombre del archivo) |
| `aliases` | `string[]` | Otros nombres para el mismo comando |
| `category` | `string` | Categoría del menú (por defecto, el nombre de la carpeta) |
| `description` | `string` | Descripción corta |
| `usage` | `string` | Ejemplo de argumentos, lo usa `ctx.usage()` |
| `cooldown` | `number` | Segundos de espera (por defecto `cooldownSeconds`) |
| `ownerOnly` | `boolean` | Solo owners |
| `groupOnly` | `boolean` | Solo en grupos |
| `privateOnly` | `boolean` | Solo en privado |
| `adminOnly` | `boolean` | Solo admins del grupo (los owners también pueden) |
| `botAdminOnly` | `boolean` | Requiere que el bot sea admin |
| `hidden` | `boolean` | No aparece en el menú |
| `run` | `async (ctx)` | Lo que hace el comando |

### El objeto `ctx`

| Propiedad | Descripción |
|---|---|
| `ctx.sock` | El socket de Baileys para usar cualquier función de la librería |
| `ctx.msg` | El mensaje original |
| `ctx.config` | La configuración cargada desde `settings.js` |
| `ctx.registry` | Lista de comandos cargados (`ctx.registry.list`) |
| `ctx.jid` | Chat donde se escribió el comando |
| `ctx.sender` / `ctx.senderIds` | Quién lo escribió |
| `ctx.pushName` | Nombre público de quien escribió |
| `ctx.isGroup` / `ctx.isOwner` / `ctx.fromMe` | Banderas útiles |
| `ctx.prefix` / `ctx.command` | Prefijo y comando usados |
| `ctx.text` / `ctx.args` | Texto después del comando, completo y separado por espacios |
| `ctx.quoted` | Mensaje respondido: `{ id, sender, message, text }` o `null` |
| `ctx.mentions` | Usuarios mencionados |
| `ctx.reply(contenido, opciones)` | Responde citando el mensaje (texto o cualquier contenido de Baileys) |
| `ctx.send(contenido, opciones)` | Envía al chat sin citar |
| `ctx.react(emoji)` | Reacciona al mensaje |
| `ctx.getGroup()` | Metadatos del grupo (con caché) |
| `ctx.isAdmin()` / `ctx.isBotAdmin()` | Si quien escribe o el bot son admins |
| `ctx.usage()` | Responde con el uso correcto del comando |

Después de editar o crear plugins ejecuta `npm run check` para detectar errores antes de iniciar.

---

## 🧰 Comandos incluidos

| Comando | Alias | Categoría | Descripción |
|---|---|---|---|
| `.menu` | `help`, `ayuda`, `comandos` | General | Lista de comandos |
| `.ping` | `p` | General | Latencia del bot |
| `.info` | `botinfo`, `alive`, `estado` | General | Estado, RAM y tiempo activo |
| `.owner` | `creador` | General | Contacto del owner |
| `.id` | `miid`, `myid` | General | Tus identificadores y el del chat |
| `.tagall` | `todos`, `invocar` | Grupos | Menciona a todos (admins) |
| `.hidetag` | `notificar`, `n` | Grupos | Notifica a todos sin mostrar menciones (admins) |
| `.infogrupo` | `groupinfo`, `gp` | Grupos | Información del grupo |
| `.restart` | `reiniciar` | Owner | Reinicia el bot |
| `.salir` | `leave` | Owner | El bot sale del grupo |

---

## 🗂️ Estructura del proyecto

```text
Ram-Bot/
├── index.js                 Supervisor: reinicia el bot si se cae
├── settings.js              Toda la personalización
├── package.json
├── assets/
│   └── banner.svg
├── scripts/
│   ├── check.js             Valida configuración y plugins
│   └── termux-setup.sh      Instalación rápida en Termux
└── src/
    ├── main.js              Arranque del bot
    ├── core/
    │   ├── config.js        Carga y normaliza settings.js
    │   ├── connection.js    Conexión, vinculación y reconexión
    │   ├── handler.js       Permisos, cooldowns y ejecución de comandos
    │   ├── plugin-loader.js Carga automática de plugins
    │   ├── group-cache.js   Caché de metadatos de grupos
    │   ├── cooldowns.js     Control anti-spam
    │   ├── logger.js        Logs con colores
    │   └── exit-codes.js    Códigos de salida del supervisor
    ├── lib/
    │   ├── message.js       Lectura de texto, citas y menciones
    │   ├── jid.js           Utilidades de identificadores
    │   └── utils.js         Funciones comunes
    └── plugins/
        ├── _plantilla.js    Ejemplo para copiar
        ├── general/         menu, ping, info, owner, id
        ├── group/           tagall, hidetag, infogrupo
        └── owner/           restart, salir
```

La sesión de WhatsApp se guarda en `sessions/`, que ya está en `.gitignore`. **No la subas ni la compartas**: quien la tenga controla la cuenta.

---

## 🛠️ Solución de problemas

<details>
<summary><b>Error «Faltan dependencias» o <code>ERR_MODULE_NOT_FOUND</code></b></summary>

Ejecuta `npm install` dentro de la carpeta del bot y revisa con `node -v` que tengas Node 20 o superior. Si no, actualiza con `pkg upgrade -y` y `pkg install -y nodejs-lts`.
</details>

<details>
<summary><b>No aparece el código o WhatsApp no lo acepta</b></summary>

Verifica que el número tenga código de país y solo dígitos, que tengas internet y que escribas el código antes de que expire. Si algo quedó a medias, borra la sesión con `rm -rf sessions` y vuelve a ejecutar `npm start`.
</details>

<details>
<summary><b>El bot dice que la sesión se cerró</b></summary>

Cuando WhatsApp cierra la sesión desde el teléfono, el bot borra la sesión local y te pide vincular de nuevo en el siguiente arranque automático.
</details>

<details>
<summary><b>«La conexión fue reemplazada»</b></summary>

Hay otra copia del bot usando la misma sesión. Ciérrala (por ejemplo con `pkill node`) y vuelve a iniciar solo una.
</details>

<details>
<summary><b>Soy owner pero el bot no me reconoce</b></summary>

Escribe `.id` y copia el número de tu identificador `@lid`. Agrégalo en `extraOwnerIds` dentro de `settings.js`.
</details>

<details>
<summary><b>El bot se apaga cuando cierro Termux</b></summary>

Usa `termux-wake-lock`, ejecútalo dentro de `tmux` y desactiva la optimización de batería para Termux en los ajustes de Android.
</details>

<details>
<summary><b>Cambié un plugin y no se nota</b></summary>

Los plugins se cargan al iniciar. Reinicia con `.restart` o detén el bot con `Ctrl + C` y ejecuta `npm start`.
</details>

<details>
<summary><b>Quiero ver más detalle en los logs</b></summary>

Cambia `logLevel` a `'info'` o `'debug'` en `settings.js`.
</details>

---

## 🤝 Créditos

- [**Baileys**](https://github.com/WhiskeySockets/Baileys), por la comunidad de WhiskeySockets, la base de todo.
- [**BaileysX**](https://github.com/Neykoor/BaileysX), fork mantenido por [Neykoor](https://github.com/Neykoor), usado aquí como `baileys` en la versión `npm:@neykoor/baileys@8.0.2-rc18`.

> ⚠️ Este proyecto no está afiliado a WhatsApp ni a Meta. Úsalo con responsabilidad: el envío masivo o no solicitado de mensajes puede llevar a la suspensión de tu cuenta.

## 📜 Licencia

Distribuido bajo la licencia [MIT](./LICENSE).

<div align="center">

**👑 Ram, la bot que viene a coronar**

</div>
