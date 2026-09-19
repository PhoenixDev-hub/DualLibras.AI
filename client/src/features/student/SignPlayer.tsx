import { useState } from 'react'
import { ArrowRight, Play, RotateCcw } from 'lucide-react'
import VLibras from '../libras/components/VLibras'
import VLibrasStage from '../libras/components/VLibrasStage'
import type { LibrasUtterance } from '../libras/hooks/useLibrasTranscripts'

export default function SignPlayer({
  text,
  title,
  onNext,
  nextLabel,
  progress,
  autoPlay = false,
}: {
  text: string
  title: string
  onNext?: () => void
  nextLabel?: string
  progress?: string
  autoPlay?: boolean
}) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'translating' | 'error' | 'ready'>(
    'loading',
  )
  const [utterances, setUtterances] = useState<LibrasUtterance[]>(() =>
    autoPlay ? [{ id: Date.now(), text }] : [],
  )
  const [playingText, setPlayingText] = useState('')
  const [speed, setSpeed] = useState(1)
  const [version, setVersion] = useState(0)
  const busy = status === 'translating' || utterances.length > 0
  return (
    <section aria-label={title} className="lesson-view min-w-0 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-bold">{title}</h2>
          {progress && (
            <p className="mt-1 text-xs text-slate-500" aria-live="polite">
              {progress}
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            className="t-btn"
            disabled={!text.trim() || busy || (status !== 'ready' && status !== 'idle')}
            onClick={() => setUtterances([{ id: Date.now(), text }])}
          >
            <Play size={16} /> {busy ? 'Sinalizando…' : 'Sinalizar em Libras'}
          </button>
          {onNext && (
            <button type="button" className="t-btn-secondary" onClick={onNext}>
              {nextLabel ?? 'Próximo sinal'}
              <ArrowRight size={16} aria-hidden="true" />
            </button>
          )}
        </div>
      </div>
      <VLibrasStage
        status={status === 'idle' ? 'ready' : status}
        currentSpeed={speed}
        onSpeedChange={setSpeed}
        lessonTitle={title}
      />
      {status === 'error' && (
        <button
          className="t-btn-secondary"
          onClick={() => {
            setUtterances([])
            setStatus('loading')
            setVersion((v) => v + 1)
          }}
        >
          <RotateCcw size={16} /> Tentar novamente
        </button>
      )}
      <p className="text-sm text-slate-500" role="status">
        {playingText || 'Selecione sinalizar para acompanhar o conteúdo com o avatar.'}
      </p>
      <VLibras
        key={version}
        utterances={utterances}
        onQueued={(id) => setUtterances((items) => items.filter((item) => item.id > id))}
        onPlayingTextChange={setPlayingText}
        onStatusChange={setStatus}
        speed={speed}
      />
    </section>
  )
}
