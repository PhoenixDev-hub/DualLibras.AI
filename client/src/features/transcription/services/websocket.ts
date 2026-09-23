export type TranscriptMessage = {
  type: 'transcript' | 'status' | 'error'
  text: string
  isFinal: boolean
  error: boolean
  speaker?: string
}

export function parseTranscriptMessage(data: unknown): TranscriptMessage {
  if (typeof data !== 'string' && (typeof data !== 'object' || data === null)) {
    return { type: 'transcript', text: '', isFinal: false, error: false }
  }

  try {
    const parsed = (typeof data === 'string' ? JSON.parse(data) : data) as {
      type?: unknown
      text?: unknown
      is_final?: unknown
      isFinal?: unknown
      error?: unknown
      speaker?: unknown
    }
    const type = parsed.type === 'status' || parsed.type === 'error' ? parsed.type : 'transcript'

    return {
      type,
      text: typeof parsed.text === 'string' ? parsed.text : '',
      isFinal: Boolean(parsed.is_final ?? parsed.isFinal),
      error: Boolean(parsed.error),
      speaker: typeof parsed.speaker === 'string' ? parsed.speaker : undefined,
    }
  } catch (error) {
    console.error('[WebSocket] Erro ao parsear mensagem:', data, error)
    return {
      type: 'error',
      text: 'Falha ao processar mensagem do servidor',
      isFinal: true,
      error: true,
    }
  }
}
