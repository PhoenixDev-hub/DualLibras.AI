import {
    AlertTriangle,
    ArrowLeft,
    Clock,
    Cpu,
    FolderOpen,
    LayoutGrid,
    Maximize,
    Mic,
    MicOff,
    Minimize,
    RefreshCcw,
    Sparkles,
    Trash2,
    Type,
    Volume2,
    Wifi,
    WifiOff,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { HistoryPanel } from '../features/history/components/HistoryPanel'
import { useTranscriptHistory } from '../features/history/hooks/useTranscriptHistory'
import VLibras from '../features/libras/components/VLibras'
import VLibrasStage from '../features/libras/components/VLibrasStage'
import { useLibrasTranscripts } from '../features/libras/hooks/useLibrasTranscripts'
import ThemeToggle from '../features/theme/ThemeToggle'
import HighlightedSubtitle from '../features/transcription/components/HighlightedSubtitle'
import { useAudioCapture } from '../features/transcription/hooks/useAudioCapture'
import type { TranscriptMessage } from '../features/transcription/services/websocket'

const CONTENT_ID = 'conteudo-libras'

export default function AppPrincipal() {
  const activeTranscript = useRef<TranscriptMessage[]>([])
  const libras = useLibrasTranscripts()
  const [interpreterVersion, setInterpreterVersion] = useState(0)
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const urlTitle = searchParams.get('title')
  const urlTurma = searchParams.get('turma')

  const [texto, setTexto] = useState('')
  const [textoFinal, setTextoFinal] = useState('')
  const [traducaoFinal, setTraducaoFinal] = useState(false)
  const [temErro, setTemErro] = useState(false)
  const [vlibrasStatus, setVLibrasStatus] = useState<
    'idle' | 'loading' | 'translating' | 'error' | 'ready'
  >('loading')
  const [activeSpeaker, setActiveSpeaker] = useState('Professor')
  const [modoProjetor, setModoProjetor] = useState(false)
  const [layoutMode, setLayoutMode] = useState<'side-by-side' | 'classic'>('side-by-side')
  const [fontSize, setFontSize] = useState<'sm' | 'md' | 'lg' | 'xl'>('md')
  const [activeWord, setActiveWord] = useState<string | null>(null)
  const [recentUtterances, setRecentUtterances] = useState<
    Array<{ id: number; text: string; speaker: string }>
  >([])

  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  useEffect(() => {
    const interval = window.setInterval(() => {
      setElapsedSeconds((s) => s + 1)
    }, 1000)
    return () => window.clearInterval(interval)
  }, [])

  useEffect(() => {
    if (!modoProjetor) return
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setModoProjetor(false)
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [modoProjetor])

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60)
    const secs = totalSeconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const handleTranscript = (message: TranscriptMessage) => {
    if (message.type === 'status') return
    libras.receiveTranscript(message)
    setTexto(message.text)
    setTraducaoFinal(message.isFinal)
    setTemErro(message.error)

    if (message.speaker) {
      setActiveSpeaker(message.speaker)
    }

    if (message.isFinal && !message.error && message.text.trim()) {
      activeTranscript.current.push(message)
      setTextoFinal(message.text)
      setRecentUtterances((prev) => [
        ...prev.slice(-3),
        { id: Date.now(), text: message.text, speaker: message.speaker || 'Professor' },
      ])
    }
  }

  const {
    conectado,
    devices,
    selectedDevice,
    setSelectedDevice,
    capturing,
    audioError,
    audioLevel,
    speaking,
    latencyMs,
    latencyAlert,
    connectionMode,
    useVadGating,
    setUseVadGating,
    switchTranscriptionProvider,
    iniciarCaptura,
    pararCaptura,
  } = useAudioCapture({ onTranscript: handleTranscript })

  const {
    showPanel,
    setShowPanel,
    isSaving,
    titulo,
    setTitulo,
    savedGroups,
    abrirPainel,
    salvarAula,
    limparTranscricaoAtual,
  } = useTranscriptHistory({
    getTranscript: () => activeTranscript.current,
    onClearCurrentTranscript: () => {
      activeTranscript.current = []
      setTexto('')
      setTextoFinal('')
      setRecentUtterances([])
      setTemErro(false)
      setTraducaoFinal(false)
    },
  })

  useEffect(() => {
    if (urlTitle) {
      setTitulo(urlTitle)
    }
  }, [urlTitle, setTitulo])

  const textoBase = useMemo(() => {
    const raw = (texto || textoFinal).trim()
    return temErro ? '' : raw
  }, [texto, textoFinal, temErro])

  const textoEnviadoAoVLibras = libras.playingText

  const nextProvider = connectionMode === 'assemblyai' ? 'local' : 'assemblyai'
  const providerButtonLabel = nextProvider === 'local' ? 'Faster-Whisper' : 'AssemblyAI'

  const cycleFontSize = () => {
    setFontSize((prev) => {
      if (prev === 'sm') return 'md'
      if (prev === 'md') return 'lg'
      if (prev === 'lg') return 'xl'
      return 'sm'
    })
  }

  const handleClearCurrent = () => {
    setTexto('')
    setTextoFinal('')
    setRecentUtterances([])
  }

  const isAluno =
    activeSpeaker.toLowerCase().includes('aluno') || activeSpeaker.toLowerCase().includes('speaker')

  return (
    <main className="relative min-h-screen w-screen overflow-x-hidden bg-black light:bg-slate-50 text-[#F2F6FF] light:text-slate-900 font-sans transcription-app">
      <div className="light:hidden pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(83,184,255,0.18),transparent_26rem),radial-gradient(circle_at_82%_28%,rgba(47,123,255,0.15),transparent_28rem),linear-gradient(180deg,#000000_0%,#020B2B_56%,#000000_100%)]" />
      <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(rgba(130,227,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(83,184,255,0.03)_1px,transparent_1px)] bg-[length:72px_72px] [mask-image:linear-gradient(to_bottom,rgba(0,0,0,0.8),transparent_80%)]" />

      <VLibras
        key={interpreterVersion}
        speed={libras.speed}
        utterances={libras.utterances}
        onQueued={libras.acknowledge}
        onPlayingTextChange={libras.setPlayingText}
        onStatusChange={setVLibrasStatus}
      />

      {modoProjetor && <ThemeToggle className="theme-toggle-lesson" />}
      <header
        className={`relative z-30 flex flex-col gap-3 border-b border-white/10 light:border-slate-400/10 bg-slate-950/70 light:bg-white/70 px-4 py-3 backdrop-blur-xl transition-all duration-500 sm:px-6 lg:flex-row lg:items-center lg:justify-between ${
          modoProjetor ? 'hidden opacity-0 pointer-events-none' : 'opacity-100'
        }`}
        aria-label="Controles da aula"
      >
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-white/15 light:border-slate-400/15 bg-white/5 light:bg-slate-400/5 px-3 py-1.5 text-xs font-bold text-slate-300 light:text-slate-700 transition-all hover:bg-white/15 light:hover:bg-slate-400/15 hover:text-white light:hover:text-slate-900 hover:border-sky-400/40"
            aria-label="Voltar ao Painel do Professor"
            title="Voltar ao Painel do Professor"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Painel</span>
          </button>

          <div className="h-5 w-[1px] bg-white/15 light:bg-slate-400/15" />

          <div>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 rounded-md bg-red-500/20 border border-red-500/40 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-red-300 light:text-red-700">
                <span className="h-1.5 w-1.5 rounded-full bg-red-400 animate-ping" />
                {capturing ? 'AO VIVO' : 'MICROFONE DESLIGADO'}
              </span>
              <h1 className="text-sm font-black tracking-tight text-white light:text-slate-900 sm:text-base">
                {urlTitle || titulo || 'Aula ao Vivo com Libras'}
              </h1>
              {urlTurma && (
                <span className="rounded-md border border-sky-400/30 bg-sky-500/10 px-2 py-0.5 text-[11px] font-bold text-sky-300 light:text-sky-700">
                  {urlTurma}
                </span>
              )}
            </div>
            <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-400 light:text-slate-600 font-medium">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3 text-sky-400 light:text-sky-700" />
                Duração:{' '}
                <strong className="text-slate-200 light:text-slate-700">
                  {formatTimer(elapsedSeconds)}
                </strong>
              </span>
              <span>•</span>
              <span>Legenda interativa com destaque por palavra</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 lg:justify-end">
          <ThemeToggle />
          <div className="flex items-center gap-1.5 rounded-xl border border-[#82E3FF]/20 light:border-blue-500/20 bg-[#031A5C]/40 light:bg-blue-100/40 px-2.5 py-1.5 text-xs">
            <Volume2 className="w-3.5 h-3.5 text-[#82E3FF] light:text-blue-700" />
            <select
              aria-label="Microfone da aula"
              disabled={capturing}
              value={selectedDevice}
              onChange={(e) => setSelectedDevice(e.target.value)}
              className="bg-transparent text-[#F2F6FF] light:text-slate-900 border-none outline-none font-bold cursor-pointer max-w-[120px] sm:max-w-[160px]"
            >
              {devices.length === 0 && <option value="">Microfone padrão</option>}
              {devices.map((d) => (
                <option
                  key={d.deviceId}
                  value={d.deviceId}
                  className="bg-black light:bg-slate-50 text-[#F2F6FF] light:text-slate-900"
                >
                  {d.label || `Microfone (${d.deviceId.substring(0, 5)})`}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={capturing ? pararCaptura : () => iniciarCaptura()}
            className={`flex min-h-[34px] cursor-pointer items-center justify-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all ${
              capturing
                ? 'bg-red-500/25 border border-red-500/55 text-red-300 light:text-red-700 hover:bg-red-500/40 shadow-[0_0_15px_rgba(239,68,68,0.35)]'
                : 'bg-green-500/20 border border-green-500/45 text-green-300 light:text-green-700 hover:bg-green-500/35 shadow-[0_0_15px_rgba(34,197,94,0.3)]'
            }`}
          >
            {capturing ? (
              <>
                <MicOff className="w-3.5 h-3.5 animate-pulse" />
                <span>Silenciar</span>
              </>
            ) : (
              <>
                <Mic className="w-3.5 h-3.5" />
                <span>Ativar Microfone</span>
              </>
            )}
          </button>

          {capturing && (
            <div className="flex items-center gap-1.5 rounded-xl border border-[#82E3FF]/15 light:border-blue-500/15 bg-black/40 light:bg-slate-50/40 px-2.5 py-1.5 h-[34px]">
              <span className="text-[10px] text-slate-400 light:text-slate-600 font-bold">
                Áudio:
              </span>
              <div className="w-14 bg-[#031A5C] light:bg-blue-100 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-sky-400 to-emerald-400 h-full transition-all duration-75"
                  style={{ width: `${Math.min(100, (audioLevel / 120) * 100)}%` }}
                />
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={() => switchTranscriptionProvider(nextProvider)}
            disabled={!conectado}
            className={`flex min-h-[34px] cursor-pointer items-center justify-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition-all ${
              conectado
                ? 'border-[#82E3FF]/30 light:border-blue-500/30 bg-[#145DFF]/20 text-[#82E3FF] light:text-blue-700 hover:bg-[#145DFF]/35'
                : 'cursor-not-allowed border-white/10 light:border-slate-400/10 bg-white/5 light:bg-slate-400/5 text-white/35 light:text-slate-900/35'
            }`}
            title="Alternar entre AssemblyAI e Faster-Whisper local"
          >
            {nextProvider === 'local' ? (
              <Cpu className="w-3.5 h-3.5" />
            ) : (
              <RefreshCcw className="w-3.5 h-3.5" />
            )}
            <span className="hidden sm:inline">{providerButtonLabel}</span>
          </button>

          <button
            type="button"
            onClick={cycleFontSize}
            className="flex min-h-[34px] cursor-pointer items-center justify-center gap-1 rounded-xl border border-white/15 light:border-slate-400/15 bg-white/5 light:bg-slate-400/5 px-2.5 py-1.5 text-xs font-bold text-slate-200 light:text-slate-700 transition-all hover:bg-white/15 light:hover:bg-slate-400/15"
            title={`Tamanho da legenda (Atual: ${fontSize.toUpperCase()})`}
          >
            <Type className="w-3.5 h-3.5 text-sky-400 light:text-sky-700" />
            <span className="uppercase">{fontSize}</span>
          </button>

          <button
            type="button"
            onClick={() =>
              setLayoutMode((m) => (m === 'side-by-side' ? 'classic' : 'side-by-side'))
            }
            className={`flex min-h-[34px] cursor-pointer items-center justify-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition-all ${
              layoutMode === 'side-by-side'
                ? 'border-sky-400/50 bg-sky-500/20 text-sky-200 light:text-sky-700 shadow-[0_0_10px_rgba(56,189,248,0.3)]'
                : 'border-white/15 light:border-slate-400/15 bg-white/5 light:bg-slate-400/5 text-slate-300 light:text-slate-700 hover:bg-white/10 light:hover:bg-slate-400/10'
            }`}
            title="Alternar entre visualização Lado a Lado ou Clássica"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">
              {layoutMode === 'side-by-side' ? 'Lado a Lado' : 'Modo Clássico'}
            </span>
          </button>

          <button
            onClick={() => setModoProjetor(true)}
            className="flex min-h-[34px] cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-white/20 light:border-slate-400/20 bg-white/5 light:bg-slate-400/5 px-3 py-1.5 text-xs font-bold text-white light:text-slate-900 transition-all hover:bg-white/15 light:hover:bg-slate-400/15"
            title="Modo Foco / Projetor de Sala de Aula"
          >
            <Maximize className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Modo Foco</span>
          </button>

          <button
            onClick={abrirPainel}
            className="flex min-h-[34px] cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-[#82E3FF]/30 light:border-blue-500/30 bg-[#145DFF]/20 px-3 py-1.5 text-xs font-bold text-[#82E3FF] light:text-blue-700 transition-all hover:bg-[#145DFF]/40"
          >
            <FolderOpen className="w-3.5 h-3.5" />
            <span>Histórico</span>
          </button>
        </div>
      </header>

      {!modoProjetor && (
        <section
          className="relative z-10 flex flex-wrap items-center gap-4 border-b border-white/10 light:border-slate-400/10 bg-slate-950/60 light:bg-white/60 px-4 py-2 text-xs text-slate-300 light:text-slate-700 sm:px-6"
          aria-label="Estado da transcrição"
        >
          <span role="status" className="flex items-center gap-2">
            {conectado ? (
              <Wifi size={14} className="text-emerald-400 light:text-emerald-700" />
            ) : (
              <WifiOff size={14} className="text-amber-400 light:text-amber-700" />
            )}
            {conectado ? 'Transcrição conectada' : 'Ative o microfone para conectar'}
          </span>
          <span>
            {capturing
              ? speaking
                ? 'Fala detectada'
                : 'Aguardando fala'
              : 'Ative o microfone para começar'}
          </span>
          {capturing && latencyMs > 0 && (
            <span className={latencyAlert ? 'text-amber-300 light:text-amber-700' : ''}>
              Tempo de resposta: {Math.round(latencyMs)} ms
            </span>
          )}
          <label className="flex cursor-pointer items-center gap-2 sm:ml-auto">
            <input
              type="checkbox"
              checked={useVadGating}
              onChange={(event) => setUseVadGating(event.target.checked)}
              className="accent-sky-400"
            />
            Detectar pausas na fala
          </label>
        </section>
      )}

      {audioError && (
        <div className="mx-auto mt-4 w-[90vw] max-w-2xl rounded-2xl border border-red-500/40 bg-red-950/90 p-4 shadow-xl backdrop-blur-md">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-red-400 light:text-red-700 flex-shrink-0" />
            <div>
              <h4 className="text-xs font-bold text-red-300 light:text-red-700">
                Erro na transcrição de áudio
              </h4>
              <p className="text-xs text-red-200 light:text-red-700">{audioError}</p>
            </div>
          </div>
        </div>
      )}

      {modoProjetor && (
        <button
          onClick={() => setModoProjetor(false)}
          className="fixed top-4 right-4 z-50 flex items-center gap-2 rounded-full border border-white/25 light:border-slate-400/25 bg-slate-950/80 light:bg-white/80 px-4 py-2 text-xs font-bold text-white light:text-slate-900 shadow-2xl backdrop-blur-xl transition-all hover:bg-slate-900 light:hover:bg-white hover:scale-105"
        >
          <Minimize className="w-4 h-4 text-sky-400 light:text-sky-700" />
          <span>Sair do Modo Foco</span>
        </button>
      )}

      {layoutMode === 'side-by-side' && !modoProjetor ? (
        <section
          className="relative z-10 mx-auto grid w-full max-w-[1700px] grid-cols-1 gap-6 p-4 sm:p-6 lg:grid-cols-12 lg:h-[calc(100vh-80px)] lg:min-h-[620px]"
          aria-label="Área da aula: Legenda e Avatar em Libras"
        >
          <div className="transcription-panel flex flex-col justify-between overflow-hidden rounded-3xl border border-sky-500/25 bg-slate-950/75 light:bg-white/75 p-5 sm:p-7 shadow-[0_20px_60px_rgba(2,11,43,0.7)] backdrop-blur-xl transition-all lg:col-span-7">
            <header className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 light:border-slate-400/10 pb-4">
              <div className="flex items-center gap-2.5">
                <span className="flex h-3 w-3 items-center justify-center">
                  <span
                    className={`absolute inline-flex h-3 w-3 animate-ping rounded-full opacity-75 ${
                      isAluno ? 'bg-amber-400' : 'bg-sky-400'
                    }`}
                  />
                  <span
                    className={`relative inline-flex h-2 w-2 rounded-full ${
                      isAluno ? 'bg-amber-400' : 'bg-sky-400'
                    }`}
                  />
                </span>
                <span className="text-xs font-black uppercase tracking-wider text-slate-300 light:text-slate-700">
                  Legenda da Aula •{' '}
                  <span
                    className={
                      isAluno
                        ? 'text-amber-400 light:text-amber-700'
                        : 'text-sky-300 light:text-sky-700'
                    }
                  >
                    {activeSpeaker}
                  </span>
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleClearCurrent}
                  className="flex cursor-pointer items-center gap-1 rounded-lg border border-white/10 light:border-slate-400/10 bg-white/5 light:bg-slate-400/5 px-2.5 py-1 text-[11px] font-bold text-slate-400 light:text-slate-600 transition-all hover:bg-white/10 light:hover:bg-slate-400/10 hover:text-white light:hover:text-slate-900"
                  title="Limpar texto da tela"
                >
                  <Trash2 className="h-3 w-3" />
                  <span>Limpar</span>
                </button>
              </div>
            </header>

            <div className="my-auto flex flex-col justify-center py-6">
              {recentUtterances.length > 0 && (
                <div className="mb-4 space-y-2 border-b border-white/10 light:border-slate-400/10 pb-4">
                  {recentUtterances
                    .filter(
                      (item, index) =>
                        !(index === recentUtterances.length - 1 && item.text === textoBase),
                    )
                    .slice(-2)
                    .map((item) => (
                      <p
                        key={item.id}
                        className="text-sm sm:text-base font-semibold text-slate-400/75 light:text-slate-600/75 leading-relaxed"
                      >
                        <span className="mr-2 text-xs font-bold text-sky-400/60 light:text-sky-700/60 uppercase">
                          {item.speaker}:
                        </span>
                        {item.text}
                      </p>
                    ))}
                </div>
              )}

              <div id={CONTENT_ID} tabIndex={-1} className="w-full">
                <HighlightedSubtitle
                  text={textoBase}
                  isTranslating={vlibrasStatus === 'translating'}
                  translatingText={textoEnviadoAoVLibras}
                  isFinal={traducaoFinal}
                  error={temErro}
                  fontSize={fontSize}
                  onActiveWordChange={setActiveWord}
                />
              </div>
            </div>

            <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 light:border-slate-400/10 pt-4 text-xs text-slate-400 light:text-slate-600">
              <div className="flex items-center gap-2">
                <span className="inline-block h-2 w-2 rounded-full bg-sky-400" />
                <span className="text-[11px] font-medium text-slate-400 light:text-slate-600">
                  Destaque azul: <strong>guia de leitura aproximado da tradução</strong>.
                </span>
              </div>

              <div className="flex items-center gap-1.5 text-[11px] text-slate-400 light:text-slate-600">
                <Sparkles className="h-3.5 w-3.5 text-sky-400 light:text-sky-700" />
                <span>Acompanhe a tradução em Libras</span>
              </div>
            </footer>
          </div>

          <div className="lg:col-span-5 h-full">
            <VLibrasStage
              currentSpeed={libras.speed}
              onSpeedChange={libras.setSpeed}
              onReload={
                vlibrasStatus === 'error'
                  ? () => {
                      setVLibrasStatus('loading')
                      setInterpreterVersion((version) => version + 1)
                    }
                  : undefined
              }
              status={vlibrasStatus}
              activeWord={activeWord}
              className="h-full min-h-[460px]"
            />
          </div>
        </section>
      ) : (
        <section
          className={`fixed bottom-6 left-1/2 z-30 flex w-[min(94vw,1100px)] -translate-x-1/2 items-end justify-center transition-all duration-700 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${
            modoProjetor ? 'bottom-[8vh] scale-105' : 'bottom-6'
          }`}
          aria-label="Legenda flutuante da transcrição"
        >
          <div className="transcription-panel w-full overflow-hidden rounded-3xl border border-sky-500/40 bg-slate-950/90 light:bg-white/90 p-5 sm:p-7 shadow-[0_24px_80px_rgba(2,11,43,0.85)] backdrop-blur-2xl">
            <div className="mb-3 flex items-center justify-between border-b border-white/10 light:border-slate-400/10 pb-3 text-xs font-black uppercase tracking-wider text-slate-300 light:text-slate-700">
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-sky-400 animate-ping" />
                {activeSpeaker} • Legenda Ao Vivo
              </span>
              <span className="text-sky-300 light:text-sky-700">
                {vlibrasStatus === 'translating'
                  ? 'Traduzindo para Libras'
                  : capturing
                    ? 'Ouvindo...'
                    : 'Microfone desligado'}
              </span>
            </div>

            <HighlightedSubtitle
              text={textoBase}
              isTranslating={vlibrasStatus === 'translating'}
              translatingText={textoEnviadoAoVLibras}
              isFinal={traducaoFinal}
              error={temErro}
              fontSize={fontSize}
              onActiveWordChange={setActiveWord}
            />
          </div>
        </section>
      )}

      <HistoryPanel
        showPanel={showPanel}
        setShowPanel={setShowPanel}
        titulo={titulo}
        setTitulo={setTitulo}
        isSaving={isSaving}
        savedGroups={savedGroups}
        salvarAula={salvarAula}
        limparTranscricaoAtual={limparTranscricaoAtual}
      />
    </main>
  )
}
