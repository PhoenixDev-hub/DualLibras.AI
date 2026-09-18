import { useCallback, useEffect, useRef, useState } from 'react'
import { TranscriptBuffer } from '../utils/transcriptBuffer'
import type { TranscriptMessage } from '../../transcription/services/websocket'

export type LibrasUtterance = { id: number; text: string }

export function useLibrasTranscripts() {
  const sequence = useRef(0)
  const [utterances, setUtterances] = useState<LibrasUtterance[]>([])
  const [playingText, setPlayingText] = useState('')
  const [speed, setSpeed] = useState(1)
  const buffer = useRef(new TranscriptBuffer())
  const flushTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(
    () => () => {
      if (flushTimer.current !== null) clearTimeout(flushTimer.current)
      flushTimer.current = null
      buffer.current.reset()
    },
    [],
  )
  const flush = useCallback((final = false) => {
    if (flushTimer.current !== null) clearTimeout(flushTimer.current)
    flushTimer.current = null
    const text = buffer.current.flush(final)
    if (!text) return
    const utterance = { id: ++sequence.current, text }
    setUtterances((pending) => [...pending, utterance])
  }, [])
  const receiveTranscript = useCallback(
    (message: TranscriptMessage) => {
      if (message.type !== 'transcript' || message.error || !message.text.trim()) return
      buffer.current.update(message.text)
      if (message.isFinal) {
        flush(true)
      } else if (flushTimer.current === null) {
        // Do not wait indefinitely for end_of_turn during a continuous lecture.
        // This is input buffering only: playback still waits for the avatar to end.
        flushTimer.current = setTimeout(() => flush(), 300)
      }
    },
    [flush],
  )
  const acknowledge = useCallback((lastId: number) => {
    setUtterances((pending) => pending.filter(({ id }) => id > lastId))
  }, [])
  return {
    utterances,
    receiveTranscript,
    acknowledge,
    playingText,
    setPlayingText,
    speed,
    setSpeed,
  }
}
