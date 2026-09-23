import ThemeToggle from '../../theme/ThemeToggle'
import { AlertCircle, Gauge, Maximize, Minimize, RefreshCw, UserCheck } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

type VLibrasStageProps = {
  status: 'idle' | 'loading' | 'translating' | 'error' | 'ready'
  activeWord?: string | null
  currentSpeed?: number
  onSpeedChange?: (speed: number) => void
  onReload?: () => void
  lessonTitle?: string
  className?: string
}

export default function VLibrasStage({
  status,
  activeWord,
  currentSpeed = 1,
  onSpeedChange,
  onReload,
  lessonTitle = 'Aula com Libras',
  className = '',
}: VLibrasStageProps) {
  const viewportRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const [expanded, setExpanded] = useState(false)
  const ownsFullscreen = useRef(false)
  const speed = currentSpeed

  const toggleFullscreen = async () => {
    if (expanded) {
      setExpanded(false)
      if (ownsFullscreen.current && document.fullscreenElement) await document.exitFullscreen()
      ownsFullscreen.current = false
      return
    }
    setExpanded(true)
    if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
      try {
        await document.documentElement.requestFullscreen()
        ownsFullscreen.current = true
      } catch {
        ownsFullscreen.current = false
      }
    }
  }

  useEffect(() => {
    if (!expanded) return
    document.documentElement.classList.add('vlibras-stage-fullscreen')
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const exit = () => {
      if (!document.fullscreenElement) setExpanded(false)
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setExpanded(false)
    }
    document.addEventListener('fullscreenchange', exit)
    window.addEventListener('keydown', onKey)
    return () => {
      document.documentElement.classList.remove('vlibras-stage-fullscreen')
      document.body.style.overflow = previousOverflow
      document.removeEventListener('fullscreenchange', exit)
      window.removeEventListener('keydown', onKey)
      if (ownsFullscreen.current && document.fullscreenElement) {
        void document.exitFullscreen().catch(() => {})
      }
      ownsFullscreen.current = false
    }
  }, [expanded])

  useEffect(() => {
    let appliedTo: ((visible: boolean) => void) | undefined
    const syncSubtitles = () => {
      const player = window.plugin?.player
      if (!player?.toggleSubtitles) return
      if (appliedTo === player.toggleSubtitles && player.showSubtitles === expanded) return
      try {
        player.toggleSubtitles(expanded)
        appliedTo = player.toggleSubtitles
      } catch (error) {
        console.warn('[VLibras] Falha ao ajustar a legenda:', error)
      }
    }
    syncSubtitles()
    const timer = window.setInterval(syncSubtitles, 500)
    return () => {
      window.clearInterval(timer)
      try {
        window.plugin?.player?.toggleSubtitles?.(false)
      } catch (error) {
        console.warn('[VLibras] Falha ao ocultar a legenda:', error)
      }
    }
  }, [expanded])

  useEffect(() => {
    const updatePosition = () => {
      if (!stageRef.current) return
      const fullscreen = stageRef.current.dataset.expanded === 'true'
      const rect = (fullscreen ? viewportRef.current : stageRef.current)?.getBoundingClientRect()
      if (!rect) return

      if (rect.width === 0 || rect.height === 0) return

      const centerY = rect.top + rect.height * 0.5
      const centerX = rect.left + rect.width / 2

      const scale = fullscreen
        ? Math.max(0.05, Math.min((rect.width - 32) / 320, (rect.height - 24) / 440, 2.5))
        : Math.max(0.5, Math.min((rect.width - 48) / 320, (rect.height - 150) / 440, 2)) * 1.14

      document.documentElement.style.setProperty('--vlibras-top', `${centerY}px`)
      document.documentElement.style.setProperty('--vlibras-left', `${centerX}px`)
      document.documentElement.style.setProperty('--vlibras-width', '320px')
      document.documentElement.style.setProperty('--vlibras-height', '440px')
      document.documentElement.style.setProperty(
        '--vlibras-transform',
        `translate(-50%, -50%) scale(${scale})`,
      )
    }

    updatePosition()

    const observer = new ResizeObserver(() => updatePosition())
    if (stageRef.current) observer.observe(stageRef.current)
    if (viewportRef.current) observer.observe(viewportRef.current)

    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, { passive: true })

    const frame = window.requestAnimationFrame(updatePosition)
    const interval = window.setInterval(updatePosition, 500)

    return () => {
      observer.disconnect()
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition)
      window.cancelAnimationFrame(frame)
      window.clearInterval(interval)

      document.documentElement.style.removeProperty('--vlibras-top')
      document.documentElement.style.removeProperty('--vlibras-left')
      document.documentElement.style.removeProperty('--vlibras-width')
      document.documentElement.style.removeProperty('--vlibras-height')
      document.documentElement.style.removeProperty('--vlibras-transform')
    }
  }, [expanded])

  const handleSpeedToggle = (newSpeed: number) => {
    onSpeedChange?.(newSpeed)
  }

  const statusLabel =
    status === 'translating'
      ? 'Sinalizando em tempo real'
      : status === 'ready'
        ? 'Pronto para sinalizar'
        : status === 'loading'
          ? 'Iniciando modelo 3D...'
          : status === 'error'
            ? 'Erro no intérprete'
            : 'Aguardando voz...'

  const isTranslating = status === 'translating'

  return (
    <div
      ref={stageRef}
      data-expanded={expanded}
      className={`lesson-avatar relative flex flex-col justify-between overflow-hidden rounded-3xl border border-sky-500/25 bg-gradient-to-b from-slate-900/90 light:from-white via-[#020b24]/90 light:via-blue-50 to-black/95 light:to-white p-4 shadow-[0_20px_60px_rgba(2,11,43,0.8),inset_0_1px_1px_rgba(130,227,255,0.2)] backdrop-blur-xl transition-all duration-300 ${className}`}
    >
      <div className="avatar-decoration pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_50%_35%,rgba(20,93,255,0.22),transparent_70%)]" />
      <div className="avatar-decoration pointer-events-none absolute bottom-0 left-1/2 -z-10 h-36 w-64 -translate-x-1/2 rounded-full bg-sky-500/10 blur-2xl" />

      <div className="avatar-decoration pointer-events-none absolute bottom-12 left-1/2 -z-10 h-16 w-52 -translate-x-1/2 rounded-[100%] border border-sky-400/20 bg-gradient-to-t from-sky-500/15 to-transparent" />

      {expanded && (
        <header className="avatar-focus-header">
          <div className="avatar-focus-heading">
            <span className="avatar-focus-logo">
              <UserCheck size={24} />
            </span>
            <div className="min-w-0">
              <p className="avatar-focus-eyebrow">DualLibras.AI · Intérprete</p>
              <h2 className="avatar-focus-title">{lessonTitle}</h2>
            </div>
          </div>
          <ThemeToggle />
          <button
            type="button"
            className="avatar-focus-exit"
            onClick={() => void toggleFullscreen()}
          >
            <Minimize size={18} /> <span>Voltar à aula</span>
            <kbd>Esc</kbd>
          </button>
        </header>
      )}
      {!expanded && (
        <header className="relative z-30 flex items-center justify-between gap-2 flex-wrap border-b border-white/10 light:border-slate-400/10 pb-3">
          <div className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-lg border border-sky-400/40 bg-sky-500/15 text-sky-300 light:text-sky-700">
              <UserCheck className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-100 light:text-slate-800">
                Intérprete Virtual
              </h3>
              <p className="text-[11px] font-medium text-slate-400 light:text-slate-600">
                Libras 3D • Ícaro
              </p>
            </div>
          </div>

          <div
            className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold transition-all ${
              isTranslating
                ? 'border border-sky-400/50 bg-sky-500/25 text-sky-200 light:text-sky-700 shadow-[0_0_12px_rgba(56,189,248,0.5)]'
                : status === 'error'
                  ? 'border border-red-500/50 bg-red-500/20 text-red-300 light:text-red-700'
                  : 'border border-white/10 light:border-slate-400/10 bg-white/5 light:bg-slate-400/5 text-slate-300 light:text-slate-700'
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                isTranslating
                  ? 'bg-sky-400 animate-ping'
                  : status === 'ready'
                    ? 'bg-emerald-400'
                    : status === 'error'
                      ? 'bg-red-400'
                      : 'bg-yellow-400 animate-pulse'
              }`}
            />
            <span>{statusLabel}</span>
          </div>
        </header>
      )}

      {expanded && (
        <div className="avatar-focus-status" role="status" data-status={status}>
          <span className="avatar-focus-dot" />
          {statusLabel}
          <span className="avatar-focus-divider" />
          Libras 3D
        </div>
      )}
      <div
        ref={viewportRef}
        className="avatar-viewport relative my-auto flex min-h-[320px] sm:min-h-[480px] w-full items-center justify-center pointer-events-none"
      >
        {status === 'loading' && (
          <div className="flex flex-col items-center gap-2 text-center text-slate-400 light:text-slate-600">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-sky-400 border-t-transparent" />
            <span className="text-xs font-medium">Carregando avatar 3D...</span>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center gap-2 text-center text-red-300 light:text-red-700 p-4">
            <AlertCircle className="h-8 w-8 text-red-400 light:text-red-700" />
            <span className="text-xs font-bold">Não foi possível carregar o VLibras.</span>
            <span className="text-[11px] text-red-300/80 light:text-red-700/80">
              Verifique sua conexão com a internet.
            </span>
          </div>
        )}

        {!expanded && isTranslating && activeWord && (
          <div className="absolute bottom-6 left-1/2 z-30 -translate-x-1/2 whitespace-nowrap rounded-xl border border-sky-400/40 bg-slate-950/85 light:bg-white/85 px-4 py-1.5 text-xs font-black text-white light:text-slate-900 shadow-[0_4px_20px_rgba(0,0,0,0.8),0_0_15px_rgba(56,189,248,0.4)] backdrop-blur-md transition-all">
            <span className="mr-1.5 text-sky-400 light:text-sky-700">Leitura:</span>
            <span className="text-sky-200 light:text-sky-700 uppercase tracking-wide">
              {activeWord}
            </span>
          </div>
        )}
      </div>

      <footer className="avatar-stage-footer relative z-30 flex items-center justify-between flex-wrap gap-3 border-t border-white/10 light:border-slate-400/10 pt-3 text-xs">
        {expanded && (
          <div className="avatar-focus-caption">
            <span className="avatar-focus-eyebrow">
              {activeWord && isTranslating ? 'Guia de leitura' : 'Acompanhe os sinais'}
            </span>
            <strong>{activeWord && isTranslating ? activeWord : 'Tradução em Libras'}</strong>
          </div>
        )}
        <div className="avatar-speed-control flex items-center gap-1.5">
          <Gauge className="h-3.5 w-3.5 text-slate-400 light:text-slate-600" />
          <span className="text-[11px] text-slate-400 light:text-slate-600 font-semibold">
            Velocidade:
          </span>
          <div className="flex rounded-lg border border-white/10 light:border-slate-400/10 bg-slate-950/60 light:bg-white/60 p-0.5">
            {[1, 1.25, 1.5, 2].map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => handleSpeedToggle(val)}
                aria-pressed={speed === val}
                aria-label={`Velocidade ${val} vezes`}
                className={`cursor-pointer rounded px-2 py-0.5 text-[11px] font-bold transition-all ${
                  speed === val
                    ? 'bg-sky-500 text-white shadow-[0_0_8px_rgba(56,189,248,0.5)]'
                    : 'text-slate-400 light:text-slate-600 hover:text-white light:hover:text-slate-900'
                }`}
              >
                {val}x
              </button>
            ))}
          </div>
        </div>

        {!expanded && (
          <button
            type="button"
            onClick={() => void toggleFullscreen()}
            aria-pressed={expanded}
            className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-primary"
          >
            {expanded ? <Minimize size={16} /> : <Maximize size={16} />}
            {expanded ? 'Sair da tela cheia' : 'Tela cheia'}
          </button>
        )}
        {onReload && (
          <button
            type="button"
            onClick={onReload}
            className="flex cursor-pointer items-center gap-1 rounded-lg border border-white/10 light:border-slate-400/10 bg-white/5 light:bg-slate-400/5 px-2.5 py-1 text-[11px] font-bold text-slate-300 light:text-slate-700 transition-all hover:bg-white/10 light:hover:bg-slate-400/10 hover:text-white light:hover:text-slate-900"
            title="Recarregar intérprete"
          >
            <RefreshCw className="h-3 w-3" />
            <span>Resetar</span>
          </button>
        )}
      </footer>
    </div>
  )
}
