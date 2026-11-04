import { createLru } from '../lib/utils.js'

export const createGroupCache = ({ ttlMs = 60_000, limit = 200 } = {}) => {
  const store = createLru(limit)
  const inflight = new Map()
  let sock = null

  const peek = jid => {
    const entry = store.get(jid)
    return entry && entry.expires > Date.now() ? entry.data : undefined
  }

  const set = (jid, data) => {
    store.set(jid, { data, expires: Date.now() + ttlMs })
  }

  const invalidate = jid => {
    store.delete(jid)
  }

  const get = async jid => {
    const cached = peek(jid)
    if (cached) return cached

    const pending = inflight.get(jid)
    if (pending) return pending

    if (!sock) throw new Error('El socket de WhatsApp no está disponible todavía.')

    const request = sock
      .groupMetadata(jid)
      .then(data => {
        set(jid, data)
        return data
      })
      .finally(() => inflight.delete(jid))

    inflight.set(jid, request)
    return request
  }

  const attach = nextSock => {
    sock = nextSock

    nextSock.ev.on('groups.upsert', groups => {
      for (const group of groups) {
        if (group?.id) set(group.id, group)
      }
    })

    nextSock.ev.on('groups.update', updates => {
      for (const update of updates) {
        if (update?.id) invalidate(update.id)
      }
    })

    nextSock.ev.on('group-participants.update', update => {
      if (update?.id) invalidate(update.id)
    })
  }

  return { get, peek, set, invalidate, attach }
}
