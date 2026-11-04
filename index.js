import { fork } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { EXIT } from './src/core/exit-codes.js'

const entry = join(dirname(fileURLToPath(import.meta.url)), 'src', 'main.js')
const STABLE_AFTER_MS = 60_000
const MAX_CRASHES = 6

let child = null
let crashes = 0
let startedAt = 0
let stopping = false

const spawnChild = () => {
  startedAt = Date.now()
  child = fork(entry, process.argv.slice(2), { stdio: 'inherit' })

  child.once('error', error => {
    console.error('No se pudo iniciar el bot:', error.message)
    process.exit(EXIT.FATAL)
  })

  child.once('exit', code => {
    child = null

    if (stopping || code === EXIT.OK || code === EXIT.FATAL) {
      process.exit(code ?? EXIT.OK)
    }

    if (code === EXIT.RESTART) {
      crashes = 0
      setTimeout(spawnChild, 500)
      return
    }

    crashes = Date.now() - startedAt > STABLE_AFTER_MS ? 1 : crashes + 1

    if (crashes > MAX_CRASHES) {
      console.error(`El bot se cerró ${MAX_CRASHES} veces seguidas. Revisa el error de arriba y ejecuta npm start de nuevo.`)
      process.exit(EXIT.FATAL)
    }

    const delay = Math.min(2000 * 2 ** (crashes - 1), 30_000)
    console.error(`El bot se cerró (código ${code}). Reiniciando en ${Math.round(delay / 1000)}s...`)
    setTimeout(spawnChild, delay)
  })
}

const stop = signal => {
  stopping = true
  if (!child) process.exit(EXIT.OK)
  child.kill(signal)
  setTimeout(() => child?.kill('SIGKILL'), 8000).unref()
}

process.on('SIGINT', () => stop('SIGINT'))
process.on('SIGTERM', () => stop('SIGTERM'))

spawnChild()
