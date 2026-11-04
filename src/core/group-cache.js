import { createLru } from '../lib/utils.js'

const participantId = participant => (typeof participant === 'string' ? participant : participant?.id)

const applyParticipantsUpdate = (data, action, participants) => {
  const current = Array.isArray(data.participants) ? data.participants : []
  const ids = new Set(participants.map(participantId).filter(Boolean))

  if (action === 'add') {
    const existing = new Set(current.map(p => p.id))
    const added = participants
      .filter(p => participantId(p) && !existing.has(participantId(p)))
      .map(p => (typeof p === 'string' ? { id: p } : p))
    return added.length ? { ...data, participants: [...current, ...added] } : data
  }

  if (action === 'remove') {
    return { ...data, participants: current.filter(p => !ids.has(p.id)) }
  }

  if (action === 'promote') {
    return { ...data, participants: current.map(p => (ids.has(p.id) ? { ...p, admin: 'admin' } : p)) }
  }

  if (action === 'demote') {
    return { ...data, participants: current.map(p => (ids.has(p.id) ? { ...p, admin: null } : p)) }
  }

  return data
}

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
    inflight.delete(jid)
  }

  const patch = (jid, update) => {
    const entry = store.get(jid)
    if (!entry || entry.expires <= Date.now()) {
      invalidate(jid)
      return
    }
    store.set(jid, { data: update(entry.data), expires: entry.expires })
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
        if (inflight.get(jid) === request) set(jid, data)
        return data
      })
      .finally(() => {
        if (inflight.get(jid) === request) inflight.delete(jid)
      })

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
        if (update?.id) patch(update.id, data => ({ ...data, ...update }))
      }
    })

    nextSock.ev.on('group-participants.update', update => {
      if (!update?.id) return
      patch(update.id, data => applyParticipantsUpdate(data, update.action, update.participants ?? []))
    })
  }

  return { get, peek, set, invalidate, attach }
}
