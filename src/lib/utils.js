export const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

export const digits = value => String(value ?? '').replace(/\D/g, '')

export const render = (template, vars = {}) =>
  String(template ?? '').replace(/\{(\w+)\}/g, (match, key) =>
    Object.prototype.hasOwnProperty.call(vars, key) ? String(vars[key] ?? '') : match
  )

export const formatDuration = ms => {
  const total = Math.max(0, Math.floor(ms / 1000))
  const days = Math.floor(total / 86400)
  const hours = Math.floor((total % 86400) / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  const seconds = total % 60

  const parts = []
  if (days) parts.push(`${days}d`)
  if (hours) parts.push(`${hours}h`)
  if (minutes) parts.push(`${minutes}m`)
  if (seconds || parts.length === 0) parts.push(`${seconds}s`)
  return parts.join(' ')
}

export const formatBytes = bytes => {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  const value = bytes / 1024 ** exponent
  return `${value.toFixed(exponent === 0 ? 0 : 1)} ${units[exponent]}`
}

export const toNumber = value => {
  if (value && typeof value === 'object' && typeof value.toNumber === 'function') {
    return value.toNumber()
  }
  return Number(value) || 0
}

export const pad = (value, size = 2) => String(value).padStart(size, '0')

export const formatDate = date => {
  const d = date instanceof Date ? date : new Date(date)
  if (Number.isNaN(d.getTime())) return '—'
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export const capitalize = value => {
  const text = String(value ?? '')
  return text ? text[0].toUpperCase() + text.slice(1) : text
}

export const createLru = (limit = 500) => {
  const map = new Map()

  const get = key => {
    if (!map.has(key)) return undefined
    const value = map.get(key)
    map.delete(key)
    map.set(key, value)
    return value
  }

  const set = (key, value) => {
    if (map.has(key)) map.delete(key)
    map.set(key, value)
    while (map.size > limit) {
      map.delete(map.keys().next().value)
    }
    return value
  }

  return { get, set, has: key => map.has(key), delete: key => map.delete(key), clear: () => map.clear(), get size() { return map.size } }
}
