import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Clock, Hand, Mic, ShieldCheck, Square } from 'lucide-react'
import ProjectLogo from '../components/brand/ProjectLogo'
import ThemeToggle from '../features/theme/ThemeToggle'
import '../features/demo/demo.css'
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
    <div className="demo-page transcription-app">
      <VLibras
        key={version}
        utterances={libras.utterances}
        onQueued={libras.acknowledge}
        onPlayingTextChange={libras.setPlayingText}
        onStatusChange={setStatus}
        speed={libras.speed}
      />
      <header className="demo-header">
        <div className="demo-container demo-header-inner">
          <Link to="/" aria-label="DualLibras — início">
            <ProjectLogo />
          </Link>
          <nav className="demo-header-actions" aria-label="Navegação da demonstração">
            <Link to="/entrar" className="demo-button demo-button-outline">
              Entrar na minha conta
            </Link>
            <ThemeToggle />
          </nav>
        </div>
      </header>
      <main className="demo-container demo-main" id="conteudo">
        <Link to="/" className="demo-back">
          <ArrowLeft size={16} aria-hidden="true" /> Voltar ao início
        </Link>
        <header className="demo-intro">
          <p className="demo-eyebrow">
            <Hand size={17} aria-hidden="true" /> Conheça na prática
          </p>
          <h1>
            Experimente o <span>DualLibras.</span>
          </h1>
          <p className="demo-description">
            Fale pelo microfone e acompanhe a transcrição e o avatar em Libras, como em uma aula.
            Você também pode experimentar digitando uma frase.
          </p>
          <div className="demo-badges">
            <span>
              <Clock size={16} aria-hidden="true" /> Até 60 segundos
            </span>
            <span>
              <ShieldCheck size={16} aria-hidden="true" /> Sem cadastro
            </span>
          </div>
        </header>
        <div className="demo-workspace">
          <section className="demo-card" aria-labelledby="demo-text-title">
            <h2 id="demo-text-title">O que vamos comunicar?</h2>
            <div className="demo-voice" data-capturing={audio.capturing}>
              <div className="demo-voice-heading">
                <span className="demo-icon">
                  <Mic size={23} aria-hidden="true" />
                </span>
                <div>
                  <h3>Experimente com sua voz</h3>
                  <p>Fale, acompanhe e descubra.</p>
                </div>
              </div>
              <p className="demo-note">
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
                className={`demo-button demo-button-wide ${audio.capturing ? 'demo-button-stop' : ''}`}
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
                <p role="status" className="demo-recording">
                  <span aria-hidden="true" />
                  {audio.conectado
                    ? 'Ouvindo. Fale uma frase curta e faça uma pausa.'
                    : 'Conectando ao serviço de transcrição…'}
                </p>
              )}
              {audio.audioError && (
                <p role="alert" className="demo-error">
                  {audio.audioError}
                </p>
              )}
              {transcript && (
                <div className="demo-transcript">
                  <span className="demo-label">Sua fala em texto</span>
                  <p role="status">{transcript}</p>
                </div>
              )}
            </div>
            <div className="demo-divider">
              <span>Ou experimente com texto</span>
            </div>
            <div className="demo-examples" aria-label="Frases de exemplo">
              {examples.map((example) => (
                <button
                  key={example}
                  type="button"
                  onClick={() => setText(example)}
                  aria-pressed={text === example}
                  className="demo-example"
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
              <label htmlFor="demo-text" className="demo-label">
                Sua frase
              </label>
              <textarea
                id="demo-text"
                value={text}
                onChange={(event) => setText(event.target.value)}
                maxLength={240}
                rows={4}
                aria-describedby="demo-limit"
                className="demo-textarea"
              />
              <p id="demo-limit" className="demo-counter">
                {text.length}/240 caracteres
              </p>
              <button
                type="submit"
                disabled={busy || audio.capturing || starting || status === 'error' || !text.trim()}
                className="demo-button demo-button-outline demo-button-wide"
              >
                <Hand size={20} aria-hidden="true" />
                {status === 'loading'
                  ? 'Carregando avatar…'
                  : busy
                    ? 'Reproduzindo…'
                    : 'Ver em Libras'}
              </button>
            </form>
            <p className="demo-disclaimer">
              Tradução automática pelo VLibras. Pode apresentar limitações e não substitui um
              intérprete.
            </p>
            {libras.playingText && (
              <p role="status" className="demo-playing">
                {libras.playingText}
              </p>
            )}
          </section>
          <div className="demo-avatar-column">
            <VLibrasStage
              status={status}
              lessonTitle="Demonstração de Libras"
              currentSpeed={libras.speed}
              onSpeedChange={libras.setSpeed}
              className="demo-avatar"
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
            <p className="demo-avatar-note">
              <Hand size={17} aria-hidden="true" /> O avatar acompanha o texto da sua fala ou da
              frase escolhida.
            </p>
          </div>
        </div>
        <footer className="demo-invitation">
          <div>
            <h2>Leve essa experiência para a sala de aula.</h2>
            <p>Entre na sua conta para acessar suas turmas e aulas.</p>
          </div>
          <Link to="/entrar" className="demo-button">
            Entrar na minha conta <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </footer>
      </main>
    </div>
  )
}
