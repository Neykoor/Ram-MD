import { getContentType, normalizeMessageContent } from 'baileys'

const parseNativeFlowId = paramsJson => {
  if (typeof paramsJson !== 'string' || !paramsJson) return ''
  try {
    const parsed = JSON.parse(paramsJson)
    return typeof parsed?.id === 'string' ? parsed.id : ''
  } catch {
    return ''
  }
}

export const getContent = message => normalizeMessageContent(message) ?? null

export const getText = message => {
  const content = getContent(message)
  if (!content) return ''

  return (
    content.conversation ||
    content.extendedTextMessage?.text ||
    content.imageMessage?.caption ||
    content.videoMessage?.caption ||
    content.documentMessage?.caption ||
    content.buttonsResponseMessage?.selectedButtonId ||
    content.listResponseMessage?.singleSelectReply?.selectedRowId ||
    content.templateButtonReplyMessage?.selectedId ||
    parseNativeFlowId(content.interactiveResponseMessage?.nativeFlowResponseMessage?.paramsJson) ||
    ''
  )
}

export const getContextInfo = message => {
  const content = getContent(message)
  if (!content) return null
  const type = getContentType(content)
  return (type && content[type]?.contextInfo) || null
}

export const getQuoted = message => {
  const info = getContextInfo(message)
  if (!info?.quotedMessage) return null

  const content = normalizeMessageContent(info.quotedMessage) ?? info.quotedMessage
  return {
    id: info.stanzaId,
    sender: info.participant,
    message: content,
    text: getText(content)
  }
}

export const getMentions = message => getContextInfo(message)?.mentionedJid ?? []
