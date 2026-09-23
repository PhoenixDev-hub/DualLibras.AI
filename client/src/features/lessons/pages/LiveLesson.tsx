import Materials from '../../materials/pages/Materials'
import { authApi } from '../../../services/authApi'
import { useEffect, useRef, useState } from 'react'
import { useTeacher } from '../../../contexts/TeacherContext'
import { TranscriptOutbox } from '../../transcription/services/transcriptOutbox'
import { Mic, MicOff } from 'lucide-react'
import { PageTitle } from '../../../components/ui'
import type { Lesson } from '../../../types/education'
import VLibras from '../../libras/components/VLibras'
import VLibrasStage from '../../libras/components/VLibrasStage'
import HighlightedSubtitle from '../../transcription/components/HighlightedSubtitle'
import { useAudioCapture } from '../../transcription/hooks/useAudioCapture'
import { useLibrasTranscripts } from '../../libras/hooks/useLibrasTranscripts'

export default function LiveLesson({ lesson, onFinish }: { lesson: Lesson; onFinish: () => Promise<void> }) {
  const { user } = useTeacher()
  const [outbox] = useState(() => {
    try {
      if (!user) return null
      return new TranscriptOutbox(localStorage, user.id, String(lesson.id), async entry => {
        const current = await authApi.me()
        if (current.id !== user.id) throw new Error('A conta mudou. Entre novamente com a conta desta aula.')
        await authApi.publishTranscript(lesson.id, entry)
      })
    } catch { return null }
  })
  const [pending, setPending] = useState(() => outbox?.count ?? 0)
  const [finishing, setFinishing] = useState(false)
  const unsaved = useRef<string[]>([])
  const [unsavedText, setUnsavedText] = useState('')
  const [publicationError, setPublicationError] = useState('')
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
    lessonId: lesson.id,
    onTranscript: (message) => {
      if (message.error || message.type !== 'transcript') return
      libras.receiveTranscript(message)
      if (message.isFinal && message.text.trim()) {
        try {
          if (!outbox) throw new Error('Armazenamento local indisponível')
          outbox.add(message.text)
          void outbox.flush().catch(() => setPublicationError('Há trechos pendentes. Tentaremos reenviar; não limpe os dados do navegador.'))
        } catch {
          unsaved.current.push(message.text)
          setUnsavedText(unsaved.current.join('\n\n'))
          setPublicationError('Não foi possível guardar o trecho no navegador. Copie o texto abaixo antes de sair e tente reenviar.')
          void pararCaptura()
        }
      }
      setText(message.text)
      setIsFinal(message.isFinal)
    },
  })

  useEffect(() => {
    if (!outbox) return
    const unsubscribe = outbox.subscribe(() => setPending(outbox.count))
    const flush = () => {
      void outbox.flush().then(() => {
        if (!unsaved.current.length) setPublicationError('')
      }).catch(() => setPublicationError('Há trechos pendentes. Reconecte para reenviar.'))
    }
    flush()
    const timer = window.setInterval(flush, 5000)
    window.addEventListener('online', flush)
    const protect = (event: BeforeUnloadEvent) => {
      if (outbox.count || unsaved.current.length) { event.preventDefault(); event.returnValue = '' }
    }
    window.addEventListener('beforeunload', protect)
    return () => {
      unsubscribe()
      window.clearInterval(timer)
      window.removeEventListener('online', flush)
      window.removeEventListener('beforeunload', protect)
    }
  }, [outbox])

  const stopRef = useRef(pararCaptura)
  stopRef.current = pararCaptura
  useEffect(() => {
    if (pending >= 100) {
      void stopRef.current()
      setPublicationError('Captura pausada: há 100 trechos aguardando envio. Reconecte antes de continuar.')
    }
  }, [pending])

  async function finish() {
    setFinishing(true)
    try {
      await pararCaptura()
      if (!outbox) throw new Error('Armazenamento indisponível')
      while (unsaved.current.length) {
        outbox.add(unsaved.current[0])
        unsaved.current.shift()
      }
      setUnsavedText('')
      await outbox.flush()
      await onFinish()
    } catch (error) {
      setPublicationError(error instanceof Error ? error.message : 'Não foi possível encerrar. Os trechos continuam pendentes.')
    } finally { setFinishing(false) }
  }

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
        <span className="text-sm text-slate-500 dark:text-slate-400" role="status">
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
          <button className="t-btn" disabled={finishing || !outbox || pending >= 100 || !!unsavedText} onClick={capturing ? pararCaptura : () => iniciarCaptura()}>
            {capturing ? <MicOff size={16} /> : <Mic size={16} />}
            {capturing ? 'Silenciar' : 'Ativar microfone'}
          </button>
          <button className="t-btn-secondary" disabled={finishing || !outbox} onClick={() => void finish()}>
            {finishing ? 'Salvando e encerrando…' : 'Encerrar aula'}
          </button>
        </div>
      </section>
      {!outbox && <p role="alert">Armazenamento local indisponível. Ative o armazenamento do navegador para capturar e preservar os trechos.</p>}
      <p role="status">{pending ? `${pending} trechos aguardando confirmação` : 'Todos os trechos recebidos foram confirmados'}</p>
      {unsavedText && <textarea aria-label="Trechos não salvos: copie antes de sair" readOnly value={unsavedText} className="t-input" />}
      {publicationError && <p role="alert">{publicationError}</p>}
      {audioError && (
        <p
          role="alert"
          className="mb-4 rounded-xl bg-red-50 dark:bg-red-950 p-4 text-sm text-red-700 dark:text-red-300"
        >
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
        <article className="t-card flex min-w-0 flex-col p-6 text-slate-800 dark:text-slate-100">
          <h2 className="mb-5 border-b border-slate-200 dark:border-slate-700 pb-4 text-sm font-bold">
            Legenda da aula
          </h2>
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
          <p className="mt-5 border-t border-slate-200 dark:border-slate-700 pt-4 text-xs text-slate-500 dark:text-slate-400">
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
      <section className="mt-7">
        <Materials classroomId={lesson.classroomId} lessonId={lesson.id} />
      </section>
    </>
  )
}
