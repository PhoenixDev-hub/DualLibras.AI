import { useState } from 'react'
import { Mic, MicOff } from 'lucide-react'
import { PageTitle } from '../../../components/ui'
import type { Lesson } from '../../../types/education'
import VLibras from '../../libras/components/VLibras'
import VLibrasStage from '../../libras/components/VLibrasStage'
import HighlightedSubtitle from '../../transcription/components/HighlightedSubtitle'
import { useAudioCapture } from '../../transcription/hooks/useAudioCapture'
import { useLibrasTranscripts } from '../../libras/hooks/useLibrasTranscripts'

export default function LiveLesson({ lesson }: { lesson: Lesson }) {
  const [interpreterVersion, setInterpreterVersion] = useState(0)
  const [interactive, setInteractive] = useState(false)
  const [text, setText] = useState('')
  const libras = useLibrasTranscripts()
  const translation = libras.playingText
  const [isFinal, setIsFinal] = useState(false)
  const [status, setStatus] = useState<'idle' | 'loading' | 'translating' | 'error' | 'ready'>(
    'loading',
  )
  const [activeWord, setActiveWord] = useState<string | null>(null)
  const [fontSize, setFontSize] = useState<'sm' | 'md' | 'lg' | 'xl'>('md')
  const { capturing, conectado, audioError, iniciarCaptura, pararCaptura } = useAudioCapture({
    onTranscript: (message) => {
      if (message.error || message.type !== 'transcript') return
      libras.receiveTranscript(message)
      setText(message.text)
      setIsFinal(message.isFinal)
    },
  })

  return (
    <>
      <PageTitle
        title={lesson.title}
        description="Acompanhe a aula com legendas e tradução em Libras."
      />
      <section
        className="t-card mb-5 flex flex-wrap items-center justify-between gap-4 p-4"
        aria-label="Controles da aula"
      >
        <span className="text-sm text-slate-500" role="status">
          {!conectado
            ? 'Ative o microfone para conectar'
            : capturing
              ? 'Microfone ativo'
              : 'Ative o microfone para começar'}
        </span>
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="accent-primary"
              checked={interactive}
              onChange={(event) => setInteractive(event.target.checked)}
            />
            Interagir com o VLibras
          </label>
          <label className="flex items-center gap-2 text-sm">
            Legenda
            <select
              className="t-input w-auto"
              value={fontSize}
              onChange={(event) => setFontSize(event.target.value as typeof fontSize)}
            >
              <option value="sm">Pequena</option>
              <option value="md">Média</option>
              <option value="lg">Grande</option>
              <option value="xl">Muito grande</option>
            </select>
          </label>
          <button className="t-btn" onClick={capturing ? pararCaptura : () => iniciarCaptura()}>
            {capturing ? <MicOff size={16} /> : <Mic size={16} />}
            {capturing ? 'Silenciar' : 'Ativar microfone'}
          </button>
        </div>
      </section>
      {audioError && (
        <p role="alert" className="mb-4 rounded-xl bg-red-50 p-4 text-sm text-red-700">
          {audioError}
        </p>
      )}
      <section
        className="lesson-view grid min-w-0 gap-5 xl:grid-cols-[1.25fr_1fr]"
        aria-label="Personagem e legenda da aula"
      >
        <VLibrasStage
          currentSpeed={libras.speed}
          onSpeedChange={libras.setSpeed}
          lessonTitle={lesson.title}
          status={status}
          activeWord={activeWord}
          className="min-h-[560px] sm:min-h-[640px]"
          onReload={
            status === 'error'
              ? () => {
                  setStatus('loading')
                  setInterpreterVersion((version) => version + 1)
                }
              : undefined
          }
        />
        <article className="t-card flex min-w-0 flex-col p-6 text-slate-800">
          <h2 className="mb-5 border-b border-slate-200 pb-4 text-sm font-bold">Legenda da aula</h2>
          <div className="my-auto max-h-[520px] overflow-y-auto py-4">
            <HighlightedSubtitle
              text={text}
              translatingText={translation}
              isTranslating={status === 'translating'}
              isFinal={isFinal}
              fontSize={fontSize}
              onActiveWordChange={setActiveWord}
            />
          </div>
          <p className="mt-5 border-t border-slate-200 pt-4 text-xs text-slate-500">
            O destaque das palavras é um guia de leitura aproximado.
          </p>
        </article>
      </section>
      <VLibras
        key={interpreterVersion}
        interactive={interactive}
        speed={libras.speed}
        utterances={libras.utterances}
        onQueued={libras.acknowledge}
        onPlayingTextChange={libras.setPlayingText}
        onStatusChange={setStatus}
      />
    </>
  )
}
