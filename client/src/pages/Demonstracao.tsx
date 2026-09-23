import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Hand, Mic, Square } from 'lucide-react'
import VLibras from '../features/libras/components/VLibras'
import VLibrasStage from '../features/libras/components/VLibrasStage'
import { useLibrasTranscripts } from '../features/libras/hooks/useLibrasTranscripts'
import { useAudioCapture } from '../features/transcription/hooks/useAudioCapture'

const examples = [
  'Olá! Seja bem-vindo à nossa escola.',
  'Bom dia! Vamos aprender juntos?',
  'Você pode repetir a explicação, por favor?',
]

export default function Demonstracao() {
  const [text, setText] = useState(examples[0])
  const libras = useLibrasTranscripts()
  const [transcript, setTranscript] = useState('')
  const [starting, setStarting] = useState(false)
  const audio = useAudioCapture({
    demo: true,
    onTranscript: (message) => {
      if (message.type === 'transcript' && !message.error) setTranscript(message.text)
      libras.receiveTranscript(message)
    },
  })
  const [status, setStatus] = useState<'idle' | 'loading' | 'translating' | 'error' | 'ready'>(
    'loading',
  )
  const [version, setVersion] = useState(0)
  const busy = status === 'loading' || status === 'translating' || libras.utterances.length > 0

  return (
    <main className="transcription-app min-h-screen bg-slate-950 text-slate-100 light:bg-slate-50 light:text-slate-900">
      <VLibras
        key={version}
        utterances={libras.utterances}
        onQueued={libras.acknowledge}
        onPlayingTextChange={libras.setPlayingText}
        onStatusChange={setStatus}
        speed={libras.speed}
      />
      <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-lg text-sm underline underline-offset-4"
        >
          <ArrowLeft size={16} aria-hidden="true" /> Voltar ao início
        </Link>
        <header className="my-8 max-w-2xl">
          <p className="mb-3 text-sm font-semibold text-sky-400 light:text-sky-700">
            Demonstração gratuita · Sem cadastro
          </p>
          <h1 className="text-3xl font-bold sm:text-4xl">Experimente o protótipo</h1>
          <p className="mt-4 text-slate-300 light:text-slate-600">
            Fale pelo microfone e acompanhe a transcrição e o avatar em Libras, como em uma aula.
            Você também pode experimentar digitando uma frase.
          </p>
        </header>
        <div className="grid items-start gap-6 lg:grid-cols-2">
          <section
            className="rounded-2xl border border-slate-700 bg-slate-900 p-6 light:border-slate-200 light:bg-white"
            aria-labelledby="demo-text-title"
          >
            <h2 id="demo-text-title" className="text-xl font-semibold">
              O que vamos comunicar?
            </h2>
            <div className="my-5 rounded-xl border border-sky-700 p-4 light:border-sky-200">
              <h3 className="font-semibold">Experimente com sua voz</h3>
              <p className="mt-2 text-sm text-slate-300 light:text-slate-600">
                Até 60 segundos por tentativa e 3 tentativas por hora por conexão. A demonstração
                não salva transcrições no histórico do projeto. Sua fala é enviada ao serviço de
                transcrição para gerar o texto.
              </p>
              <button
                type="button"
                disabled={starting || (!audio.capturing && status === 'loading')}
                onClick={async () => {
                  if (audio.capturing) {
                    await audio.pararCaptura()
                    return
                  }
                  setStarting(true)
                  setTranscript('')
                  try {
                    await audio.iniciarCaptura()
                  } finally {
                    setStarting(false)
                  }
                }}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-sky-600 px-5 py-3 font-semibold text-white hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {audio.capturing ? (
                  <Square size={18} aria-hidden="true" />
                ) : (
                  <Mic size={18} aria-hidden="true" />
                )}
                {starting
                  ? 'Preparando microfone…'
                  : audio.capturing
                    ? 'Parar demonstração'
                    : 'Testar com minha voz'}
              </button>
              {audio.capturing && (
                <p role="status" className="mt-3 text-sm">
                  {audio.conectado
                    ? 'Ouvindo. Fale uma frase curta e faça uma pausa.'
                    : 'Conectando ao serviço de transcrição…'}
                </p>
              )}
              {audio.audioError && (
                <p role="alert" className="mt-3 text-sm text-rose-400 light:text-red-700">
                  {audio.audioError}
                </p>
              )}
              {transcript && (
                <p role="status" className="mt-3 rounded-lg bg-slate-800 p-3 light:bg-slate-100">
                  {transcript}
                </p>
              )}
            </div>
            <div className="my-5 flex flex-col gap-2" aria-label="Frases de exemplo">
              {examples.map((example) => (
                <button
                  key={example}
                  type="button"
                  onClick={() => setText(example)}
                  className="rounded-xl border border-slate-600 px-4 py-3 text-left text-sm hover:border-sky-400 focus-visible:outline-2 focus-visible:outline-sky-400 light:border-slate-300"
                >
                  {example}
                </button>
              ))}
            </div>
            <form
              onSubmit={(event) => {
                event.preventDefault()
                if (busy || audio.capturing || starting || status === 'error' || !text.trim())
                  return
                libras.receiveTranscript({
                  type: 'transcript',
                  text: text.trim(),
                  isFinal: true,
                  error: false,
                })
              }}
            >
              <label htmlFor="demo-text" className="mb-2 block font-medium">
                Sua frase
              </label>
              <textarea
                id="demo-text"
                value={text}
                onChange={(event) => setText(event.target.value)}
                maxLength={240}
                rows={4}
                aria-describedby="demo-limit"
                className="w-full resize-y rounded-xl border border-slate-600 bg-slate-950 p-3 text-base focus:outline-2 focus:outline-sky-400 light:border-slate-300 light:bg-white"
              />
              <p
                id="demo-limit"
                className="mt-1 text-right text-sm text-slate-400 light:text-slate-600"
              >
                {text.length}/240 caracteres
              </p>
              <button
                type="submit"
                disabled={busy || audio.capturing || starting || status === 'error' || !text.trim()}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-sky-600 px-5 py-3 font-semibold text-white hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Hand size={20} aria-hidden="true" />
                {status === 'loading'
                  ? 'Carregando avatar…'
                  : busy
                    ? 'Reproduzindo…'
                    : 'Ver em Libras'}
              </button>
            </form>
            <p className="mt-5 text-sm text-slate-400 light:text-slate-600">
              Tradução automática pelo VLibras. Pode apresentar limitações e não substitui um
              intérprete.
            </p>
            {libras.playingText && (
              <p role="status" className="mt-4 rounded-xl bg-slate-800 p-4 light:bg-slate-100">
                {libras.playingText}
              </p>
            )}
          </section>
          <VLibrasStage
            status={status}
            lessonTitle="Demonstração de Libras"
            currentSpeed={libras.speed}
            onSpeedChange={libras.setSpeed}
            className="min-h-[460px]"
            onReload={
              status === 'error'
                ? () => {
                    libras.acknowledge(Number.MAX_SAFE_INTEGER)
                    libras.setPlayingText('')
                    setStatus('loading')
                    setVersion((value) => value + 1)
                  }
                : undefined
            }
          />
        </div>
        <footer className="mt-8 flex flex-wrap items-center gap-4 text-sm">
          <span>Quer usar a captura de voz nas suas aulas?</span>
          <Link
            to="/entrar"
            className="inline-flex items-center gap-2 font-semibold text-sky-400 underline underline-offset-4 light:text-sky-700"
          >
            Entrar na minha conta <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </footer>
      </div>
    </main>
  )
}
