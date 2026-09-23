import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Play } from 'lucide-react'
import type { Lesson } from '../../types/education'
import VLibras from '../libras/components/VLibras'
import VLibrasStage from '../libras/components/VLibrasStage'
import HighlightedSubtitle from '../transcription/components/HighlightedSubtitle'
import { useLibrasTranscripts } from '../libras/hooks/useLibrasTranscripts'

function LessonPlayer({
  text,
  title,
  live,
  summary,
}: {
  text: string
  title: string
  live: boolean
  summary: boolean
}) {
  const libras = useLibrasTranscripts()
  const { receiveTranscript } = libras
  const previous = useRef('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'translating' | 'error' | 'ready'>(
    'loading',
  )
  const [interactive, setInteractive] = useState(false)
  const [fontSize, setFontSize] = useState<'sm' | 'md' | 'lg' | 'xl'>('md')
  const [activeWord, setActiveWord] = useState<string | null>(null)
  const [version, setVersion] = useState(0)
  useEffect(() => {
    if (!live && !summary) return
    const added = text.startsWith(previous.current) ? text.slice(previous.current.length) : text
    previous.current = text
    if (added.trim())
      receiveTranscript({ type: 'transcript', text: added, isFinal: true, error: false })
  }, [text, live, summary, receiveTranscript])
  return (
    <>
      <section
        className="t-card mb-5 flex flex-wrap items-center justify-between gap-4 p-4"
        aria-label="Controles de visualização da aula"
      >
        <span className="text-sm text-slate-500 dark:text-slate-400" role="status">
          {summary
            ? 'Resumo em Libras'
            : live
              ? 'Acompanhando as transcrições do professor'
              : 'Revisão da aula'}
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
          {!live && (
            <button
              className="t-btn"
              disabled={
                !text.trim() ||
                status === 'translating' ||
                libras.utterances.length > 0 ||
                (status !== 'idle' && status !== 'ready')
              }
              onClick={() =>
                receiveTranscript({ type: 'transcript', text, isFinal: true, error: false })
              }
            >
              <Play size={16} />
              Sinalizar novamente
            </button>
          )}
        </div>
      </section>
      <section
        className="lesson-view grid min-w-0 gap-5 xl:grid-cols-[1.25fr_1fr]"
        aria-label="Personagem e legenda da aula"
      >
        <VLibrasStage
          status={status === 'idle' ? 'ready' : status}
          lessonTitle={title}
          activeWord={activeWord}
          currentSpeed={libras.speed}
          onSpeedChange={libras.setSpeed}
          className="min-h-[560px] sm:min-h-[640px]"
          onReload={
            status === 'error'
              ? () => {
                  setStatus('loading')
                  setVersion((v) => v + 1)
                }
              : undefined
          }
        />
        <article className="t-card flex min-w-0 flex-col p-6 text-slate-800 dark:text-slate-100">
          <h2 className="mb-5 border-b border-slate-200 dark:border-slate-700 pb-4 text-sm font-bold">
            {summary ? 'Resumo da aula' : 'Legenda da aula'}
          </h2>
          <div className="my-auto max-h-[520px] overflow-y-auto py-4">
            {text.trim() ? (
              <HighlightedSubtitle
                text={libras.playingText || text}
                translatingText={libras.playingText}
                isTranslating={status === 'translating'}
                isFinal
                fontSize={fontSize}
                onActiveWordChange={setActiveWord}
              />
            ) : (
              <p className="text-slate-500 dark:text-slate-400">
                Aguardando o professor disponibilizar a transcrição da aula.
              </p>
            )}
          </div>
          <p className="mt-5 border-t border-slate-200 dark:border-slate-700 pt-4 text-xs text-slate-500 dark:text-slate-400">
            O destaque das palavras é um guia de leitura aproximado.
          </p>
        </article>
      </section>
      <VLibras
        key={version}
        interactive={interactive}
        utterances={libras.utterances}
        onQueued={libras.acknowledge}
        onPlayingTextChange={libras.setPlayingText}
        onStatusChange={setStatus}
        speed={libras.speed}
      />
    </>
  )
}

export default function StudentLessonAvatar({
  lesson,
  materials,
}: {
  lesson: Lesson
  materials: ReactNode
}) {
  const [content, setContent] = useState<'lesson' | 'summary'>('lesson')
  const player = useRef<HTMLDivElement>(null)
  return (
    <div className="space-y-7">
      <div ref={player}>
        {content === 'summary' && (
          <button className="t-btn-secondary mb-4" onClick={() => setContent('lesson')}>
            Voltar à aula
          </button>
        )}
        <LessonPlayer
          key={content}
          title={lesson.title}
          text={(content === 'summary' ? lesson.summary : lesson.transcript) ?? ''}
          live={content === 'lesson' && lesson.status === 'live'}
          summary={content === 'summary'}
        />
      </div>
      <article className="t-card p-6">
        <h2 className="mb-4 font-bold">Resumo da aula</h2>
        <p className="whitespace-pre-wrap leading-8">
          {lesson.summary ||
            (lesson.status === 'live'
              ? 'O resumo ficará disponível aqui quando for publicado após a aula.'
              : 'O professor ainda não disponibilizou o resumo desta aula.')}
        </p>
        {lesson.summary && (
          <button
            className="t-btn mt-5"
            onClick={() => {
              setContent('summary')
              player.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
            }}
          >
            <Play size={16} />
            Ver resumo em Libras
          </button>
        )}
      </article>
      <section>
        <h2 className="mb-4 font-bold">Materiais usados pelo professor</h2>
        {materials}
      </section>
    </div>
  )
}
