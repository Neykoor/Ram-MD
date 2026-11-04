import pino from 'pino'
import config from './config.js'

const useColor = Boolean(process.stdout.isTTY) && !process.env.NO_COLOR

const paint = (code, text) => (useColor ? `\x1b[${code}m${text}\x1b[0m` : text)

const stamp = () => {
  const now = new Date()
  const two = value => String(value).padStart(2, '0')
  return `${two(now.getHours())}:${two(now.getMinutes())}:${two(now.getSeconds())}`
}

const format = (label, color, message) => `${paint('90', stamp())} ${paint(color, label)} ${message}`

const describe = error => {
  if (!error) return ''
  if (error instanceof Error) return `\n${error.stack || error.message}`
  if (typeof error === 'string') return `\n${error}`
  try {
    return `\n${JSON.stringify(error)}`
  } catch {
    return `\n${String(error)}`
  }
}

export const log = {
  info: message => console.log(format('INFO ', '36', message)),
  success: message => console.log(format('OK   ', '32', message)),
  warn: message => console.warn(format('WARN ', '33', message)),
  error: (message, error) => console.error(format('ERROR', '31', message + describe(error)))
}

export const style = {
  bold: text => paint('1', text),
  dim: text => paint('90', text),
  cyan: text => paint('36', text),
  green: text => paint('32', text),
  magenta: text => paint('35', text),
  yellow: text => paint('33', text),
  red: text => paint('31', text)
}

export const baileysLogger = pino({ level: config.logLevel })
