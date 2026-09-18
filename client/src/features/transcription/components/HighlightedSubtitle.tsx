import { useEffect, useMemo, useRef, useState } from 'react'
import { Sparkles, Volume2 } from 'lucide-react'

type HighlightedSubtitleProps = {
  text: string
  isTranslating: boolean
  translatingText?: string
  isFinal?: boolean
  error?: boolean
  fontSize?: 'sm' | 'md' | 'lg' | 'xl'
  onActiveWordChange?: (word: string | null) => void
}

const FONT_SIZE_CLASSES = {
  sm: 'text-xl sm:text-2xl leading-relaxed',
  md: 'text-2xl sm:text-3xl lg:text-4xl leading-relaxed',
  lg: 'text-3xl sm:text-4xl lg:text-5xl leading-tight',
  xl: 'text-4xl sm:text-5xl lg:text-6xl leading-tight',
}

export default function HighlightedSubtitle({
  text,
  isTranslating,
  translatingText = '',
  isFinal = false,
  error = false,
  fontSize = 'md',
  onActiveWordChange,
}: HighlightedSubtitleProps) {
  const [activeWordIndex, setActiveWordIndex] = useState<number>(-1)
  const timerRef = useRef<number | null>(null)
  const activeWordRef = useRef<string | null>(null)

  const tokens = useMemo(() => {
    if (!text || !text.trim()) return []
    return text.trim().split(/\s+/)
  }, [text])

  const isCurrentTranslation = isTranslating && text.trim() === translatingText.trim()

  useEffect(() => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current)
      timerRef.current = null
    }

    if (!isCurrentTranslation || tokens.length === 0) {
      setActiveWordIndex(-1)
      if (activeWordRef.current !== null) {
        activeWordRef.current = null
        onActiveWordChange?.(null)
      }
      return
    }

    const targetText = translatingText || text
    const textTime = targetText.length * 45
    const wordTime = tokens.length * 300
    const estimatedTotalMs = Math.min(12000, Math.max(2000, textTime + wordTime))
    const timePerWord = Math.max(180, Math.floor(estimatedTotalMs / tokens.length))

    let currentIndex = 0
    setActiveWordIndex(0)
    activeWordRef.current = tokens[0] || null
    onActiveWordChange?.(tokens[0] || null)

    timerRef.current = window.setInterval(() => {
      currentIndex += 1
      if (currentIndex < tokens.length) {
        setActiveWordIndex(currentIndex)
        activeWordRef.current = tokens[currentIndex] || null
        onActiveWordChange?.(tokens[currentIndex] || null)
      } else {
        if (timerRef.current) {
          window.clearInterval(timerRef.current)
          timerRef.current = null
        }
      }
    }, timePerWord)

    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [isCurrentTranslation, translatingText, text, tokens, onActiveWordChange])

  useEffect(() => {
    if (!isCurrentTranslation) return

    const checkInternalSubtitle = () => {
      const vlibrasSub = document.querySelector('.vpw-subtitles') as HTMLElement | null
      if (vlibrasSub && vlibrasSub.textContent) {
        const subWord = vlibrasSub.textContent.trim().toLowerCase()
        const matchIdx = tokens.findIndex((t) =>
          t
            .toLowerCase()
            .replace(/[^a-z0-9áéíóúãõâêîôûç]/g, '')
            .includes(subWord),
        )
        if (subWord && matchIdx >= 0) {
          setActiveWordIndex(matchIdx)
          activeWordRef.current = tokens[matchIdx] || null
          onActiveWordChange?.(tokens[matchIdx] || null)
        }
      }
    }

    const interval = window.setInterval(checkInternalSubtitle, 200)
    return () => window.clearInterval(interval)
  }, [isCurrentTranslation, tokens, onActiveWordChange])

  if (!text || !text.trim()) {
    return (
      <div className="lesson-subtitle-empty flex flex-col items-center justify-center py-12 text-center text-slate-400 select-none">
        <div className="relative mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-900/80 border border-sky-500/20 shadow-[0_0_30px_rgba(56,189,248,0.15)]">
          <Volume2 className="h-8 w-8 text-sky-400/60 animate-pulse" />
        </div>
        <p className="text-lg font-semibold text-slate-300">Aguardando a fala da aula...</p>
        <p className="mt-1 text-xs text-slate-500 max-w-sm">
          Ative o microfone para acompanhar a transcrição e a tradução em Libras.
        </p>
      </div>
    )
  }

  const currentActiveWord =
    activeWordIndex >= 0 && activeWordIndex < tokens.length ? tokens[activeWordIndex] : null

  return (
    <div className="lesson-subtitle relative w-full">
      {isTranslating && currentActiveWord && (
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-sky-400/40 bg-sky-950/70 px-3.5 py-1 text-xs font-bold text-sky-300 shadow-[0_0_15px_rgba(56,189,248,0.3)] backdrop-blur-md animate-fade-in">
          <Sparkles className="h-3.5 w-3.5 text-sky-300 animate-spin" />
          <span>Guia de leitura:</span>
          <span className="rounded bg-sky-500/30 px-2 py-0.5 font-black text-white underline decoration-sky-300 decoration-2">
            {currentActiveWord.replace(/[^a-zA-Z0-9áéíóúãõâêîôûçÁÉÍÓÚÃÕÂÊÎÔÛÇ]/g, '')}
          </span>
        </div>
      )}

      <p
        className={`font-extrabold tracking-normal text-balance transition-all duration-200 ${FONT_SIZE_CLASSES[fontSize]} ${
          error ? 'text-red-400' : 'text-slate-100'
        }`}
        lang="pt-BR"
        aria-live="polite"
      >
        {tokens.map((token, index) => {
          const isActive = isTranslating && index === activeWordIndex
          const isCompleted =
            isTranslating && activeWordIndex >= 0 ? index < activeWordIndex : isFinal
          const isPending = isTranslating && activeWordIndex >= 0 ? index > activeWordIndex : false

          if (isActive) {
            return (
              <span
                key={`${token}-${index}`}
                className="relative inline-block mx-1.5 px-3 py-1 rounded-xl font-black text-white bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 shadow-[0_0_24px_rgba(56,189,248,0.85),inset_0_1px_1px_rgba(255,255,255,0.4)] ring-2 ring-sky-300 scale-105 -translate-y-0.5 transition-all duration-150"
              >
                {token}
                <span className="absolute -top-1.5 -right-1 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-300 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-sky-400"></span>
                </span>
              </span>
            )
          }

          if (isCompleted) {
            return (
              <span
                key={`${token}-${index}`}
                className="inline-block mx-1 font-bold text-slate-100 opacity-95 transition-opacity duration-200"
              >
                {token}
              </span>
            )
          }

          if (isPending) {
            return (
              <span
                key={`${token}-${index}`}
                className="inline-block mx-1 font-medium text-slate-400 opacity-60 transition-opacity duration-200"
              >
                {token}
              </span>
            )
          }

          return (
            <span key={`${token}-${index}`} className="inline-block mx-1">
              {token}
            </span>
          )
        })}
      </p>
    </div>
  )
}
