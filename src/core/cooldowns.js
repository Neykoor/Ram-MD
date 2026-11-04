export const createCooldowns = () => {
  const entries = new Map()

  const check = (key, seconds) => {
    if (!(seconds > 0)) return { allowed: true }

    const now = Date.now()
    const entry = entries.get(key)

    if (entry && entry.until > now) {
      const notify = !entry.warned
      entry.warned = true
      return { allowed: false, remaining: Math.ceil((entry.until - now) / 1000), notify }
    }

    entries.set(key, { until: now + seconds * 1000, warned: false })
    return { allowed: true }
  }

  const sweep = () => {
    const now = Date.now()
    for (const [key, entry] of entries) {
      if (entry.until <= now) entries.delete(key)
    }
  }

  setInterval(sweep, 60_000).unref()

  return { check, sweep, get size() { return entries.size } }
}
