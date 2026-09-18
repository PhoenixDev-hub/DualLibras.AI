export type PlaybackState = {
  status?: string
  isLoaded?: boolean
  isWelcomeFinished?: boolean
  isPlayingWelcome?: boolean
  isBroken?: boolean
}

export type PlaybackPlayer = PlaybackState & {
  on?: (event: string, listener: () => void) => void
  removeListener?: (event: string, listener: () => void) => void
}

// Translation requests finish before the avatar does. Only a playing → idle
// transition (or the legacy animation:end event after animation:play) completes it.
export function playUntilFinished(
  translate: () => void | Promise<unknown>,
  getPlayer: () => PlaybackPlayer | undefined,
  signal: AbortSignal,
  timeoutMs = 120_000,
): Promise<void> {
  return new Promise((resolve, reject) => {
    let started = false
    let translationReady = false
    let settled = false
    let lastActivity = Date.now()
    const player = getPlayer()
    const cleanup = () => {
      clearInterval(poll)
      signal.removeEventListener('abort', abort)
      player?.removeListener?.('animation:play', onPlay)
      player?.removeListener?.('animation:end', onEnd)
      player?.removeListener?.('error', onError)
    }
    const finish = (error?: Error) => {
      if (settled) return
      settled = true
      cleanup()
      if (error) reject(error)
      else resolve()
    }
    const abort = () => finish(new DOMException('Reprodução cancelada', 'AbortError'))
    const onPlay = () => {
      started = true
    }
    const onEnd = () => {
      if (started) finish()
    }
    const onError = () => finish(new Error('O VLibras falhou ao reproduzir a tradução.'))
    const poll = setInterval(() => {
      const state = getPlayer()
      if (state?.isBroken) return onError()
      if (translationReady && state?.status === 'playing') started = true
      if (state?.status === 'paused') lastActivity = Date.now()
      if (translationReady && started && state?.status === 'idle') return finish()
      if (Date.now() - lastActivity >= timeoutMs) {
        finish(new Error('O VLibras não confirmou o término da animação.'))
      }
    }, 50)
    signal.addEventListener('abort', abort, { once: true })
    if (signal.aborted) return abort()
    player?.on?.('animation:play', onPlay)
    player?.on?.('animation:end', onEnd)
    player?.on?.('error', onError)
    try {
      Promise.resolve(translate())
        .then(() => {
          translationReady = true
        })
        .catch((error: unknown) => {
          finish(error instanceof Error ? error : new Error(String(error)))
        })
    } catch (error) {
      finish(error instanceof Error ? error : new Error(String(error)))
    }
  })
}
