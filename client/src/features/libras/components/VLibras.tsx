import type { HTMLAttributes } from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'

type VLibrasProps = {
  text: string
  onStatusChange?: (status: 'idle' | 'loading' | 'translating' | 'error' | 'ready') => void
}

type VLibrasElementProps = HTMLAttributes<HTMLDivElement> & {
  vw?: string
  'vw-access-button'?: string
  'vw-plugin-wrapper'?: string
}

declare global {
  interface Window {
    VLibras?: {
      Widget: new (url: string) => unknown
      Plugin?: new (options: {
        enableMoveWindow: boolean
        playWellcome: boolean
        rootPath: string
        wrapper: HTMLElement
      }) => NonNullable<Window['plugin']>
    }
    plugin?: {
      translate?: (text: string) => void
      player?: {
        setSpeed?: (speed: number) => void
      }
      setSpeed?: (speed: number) => void
    }
    VLibrasPlayer?: {
      setSpeed?: (speed: number) => void
    }
    VLibrasWidget?: {
      open?: () => void
    }
    __vlibrasWidgetStarted?: boolean
    __vlibrasWidgetBooted?: boolean
  }
}

const SCRIPT_ID = 'vlibras-widget-script'
const SCRIPT_SRC = 'https://vlibras.gov.br/app/vlibras-plugin.js'
const TRANSLATE_DELAY_MS = 300
const READY_RETRY_MS = 200
const MAX_TRANSLATE_ATTEMPTS = 30
const CENTER_WIDGET_DELAY_MS = 300
const MIN_TRANSLATION_MS = 2000
const MAX_TRANSLATION_MS = 12000
const MS_PER_CHARACTER = 45
const DEFAULT_SPEED = 2
const SPEED_RETRY_MS = 300
const SPEED_RETRY_COUNT = 15
const WIDGET_WIDTH = '320px'
const WIDGET_HEIGHT = '440px'
const DEFAULT_TRANSLATION = 'Olá! Seja bem-vindo ao DualLibra.AI'

function setImportant(element: HTMLElement, property: string, value: string) {
  element.style.setProperty(property, value, 'important')
}

export default function VLibras({ text, onStatusChange }: VLibrasProps) {
  const initialized = useRef(false)
  const widgetReady = useRef(false)
  const readyTimer = useRef<number | null>(null)
  const speedTimer = useRef<number | null>(null)
  const speedAttempts = useRef(0)
  const translating = useRef(false)
  const queue = useRef<string[]>([])
  const lastQueuedText = useRef('')
  const translateTimer = useRef<number | null>(null)
  const translateNextRef = useRef<() => boolean>(() => true)
  const [status, setStatus] = useState<'idle' | 'loading' | 'translating' | 'error' | 'ready'>(
    'idle',
  )

  useEffect(() => {
    console.debug('[VLibras] Status:', status)
  }, [status])

  const estimateTranslationTime = useCallback((value: string) => {
    const words = value.split(/\s+/).filter(Boolean).length
    const textTime = value.length * MS_PER_CHARACTER
    const wordTime = words * 300
    return Math.min(MAX_TRANSLATION_MS, Math.max(MIN_TRANSLATION_MS, textTime + wordTime))
  }, [])

  const centerWidget = useCallback(() => {
    const accessButton = document.querySelector<HTMLElement>('[vw-access-button]')
    const wrapper = document.querySelector<HTMLElement>('[vw-plugin-wrapper]')
    const newRoot = document.getElementById('vlibras-app-root')
    const newAccessWrapper = document.getElementById('vlibras-access-wrapper')

    if (newRoot) {
      const overlay = newRoot.querySelector('.vlibras-overlay') as HTMLElement
      if (overlay) setImportant(overlay, 'display', 'none')
    }

    if (accessButton) {
      setImportant(accessButton, 'display', 'none')
    }

    if (newAccessWrapper && newAccessWrapper.shadowRoot) {
      const accessBtn = newAccessWrapper.shadowRoot.getElementById('vlibras-access')
      if (accessBtn) setImportant(accessBtn, 'display', 'none')
    }

    if (wrapper) {
      setImportant(wrapper, 'width', WIDGET_WIDTH)
      setImportant(wrapper, 'height', WIDGET_HEIGHT)
      setImportant(wrapper, 'min-height', WIDGET_HEIGHT)
      setImportant(wrapper, 'max-width', '92vw')
      setImportant(wrapper, 'background', 'transparent')
      setImportant(wrapper, 'background-color', 'transparent')
      setImportant(wrapper, 'z-index', '10')
      setImportant(wrapper, 'pointer-events', 'none')
    }

    document
      .querySelectorAll<HTMLElement>(
        '.vpw-box, .vpw-controls, .vpw-subtitles, .vpw-playing, .vpw-message-box, .vp-rate-box-content, .vp-rate-box-header, .vp-enabled, .vp-button-change-avatar, .avatar-icaro, .vp-selected',
      )
      .forEach((element) => {
        setImportant(element, 'display', 'none')
      })

    if (newRoot) {
      const styleId = 'vlibras-override-styles'

      if (!document.getElementById(styleId)) {
        const style = document.createElement('style')
        style.id = styleId
        style.innerHTML = `
          #vlibras-app-root * {
            background: transparent !important;
            box-shadow: none !important;
            color: transparent !important;
            pointer-events: none !important;
          }
          #vlibras-app-root p,
          #vlibras-app-root span,
          #vlibras-app-root h1,
          #vlibras-app-root h2,
          #vlibras-app-root h3,
          #vlibras-app-root h4,
          #vlibras-app-root h5,
          #vlibras-app-root h6 {
            display: none !important;
            opacity: 0 !important;
            pointer-events: none !important;
          }
        `
        document.head.appendChild(style)
      }

      if (newRoot.shadowRoot) {
        if (!newRoot.shadowRoot.getElementById(styleId)) {
          const shadowStyle = document.createElement('style')
          shadowStyle.id = styleId
          shadowStyle.innerHTML = `
            * {
              background: transparent !important;
              box-shadow: none !important;
              border: none !important;
              color: transparent !important;
              pointer-events: none !important;
            }
            :not(canvas, .vpw-canvas, .vpw-avatar, .vpw-main, .vpw-player, .vpw-container, .vpw-wrapper, .vpw) {
            }
            header, nav, button, .menu, .settings, .controls, .vlibras-overlay, svg, img, .backdrop, p, span, h1, h2, h3, h4, h5, h6, .subtitle, .legenda, .text {
              display: none !important;
              opacity: 0 !important;
              pointer-events: none !important;
            }
            canvas {
              width: 100% !important;
              height: 100% !important;
              display: block !important;
            }
          `
          newRoot.shadowRoot.appendChild(shadowStyle)
        }
      } else {
        if (!document.getElementById(styleId + '-children')) {
          const style = document.createElement('style')
          style.id = styleId + '-children'
          style.innerHTML = `
            #vlibras-app-root header,
            #vlibras-app-root nav,
            #vlibras-app-root button,
            #vlibras-app-root .menu,
            #vlibras-app-root .settings,
            #vlibras-app-root .controls,
            #vlibras-app-root .vlibras-overlay,
            #vlibras-app-root p,
            #vlibras-app-root span,
            #vlibras-app-root h1,
            #vlibras-app-root h2,
            #vlibras-app-root h3,
            #vlibras-app-root h4,
            #vlibras-app-root h5,
            #vlibras-app-root h6 {
              display: none !important;
            }
            #vlibras-app-root canvas {
              width: 100% !important;
              height: 100% !important;
            }
          `
          document.head.appendChild(style)
        }
      }
    }

    document
      .querySelectorAll<HTMLElement>(
        '[vp], .vpw, .vpw-wrapper, .vpw-container, .vpw-main, .vpw-player, .vpw-avatar, .vpw-canvas, .emscripten, #canvas, [vw], [vw-plugin-wrapper]',
      )
      .forEach((element) => {
        setImportant(element, 'box-shadow', 'none')
        setImportant(element, 'border', '0')
        setImportant(element, 'background', 'transparent')
        setImportant(element, 'background-color', 'transparent')
      })

    const canvas = document.querySelector<HTMLElement>('#canvas')
    if (canvas) {
      setImportant(canvas, 'width', '100%')
      setImportant(canvas, 'height', '100%')
      setImportant(canvas, 'max-width', '100%')
      setImportant(canvas, 'background', 'transparent')
      setImportant(canvas, 'background-color', 'transparent')
    }

    if (newRoot && newRoot.shadowRoot) {
      const shadowCanvas = newRoot.shadowRoot.querySelector<HTMLElement>('canvas')
      if (shadowCanvas) {
        setImportant(shadowCanvas, 'width', '100%')
        setImportant(shadowCanvas, 'height', '100%')
        setImportant(shadowCanvas, 'max-width', '100%')
        setImportant(shadowCanvas, 'background', 'transparent')
        setImportant(shadowCanvas, 'background-color', 'transparent')
      }
    }
  }, [])

  const applyDefaultSpeed = useCallback(() => {
    try {
      window.VLibrasPlayer?.setSpeed?.(DEFAULT_SPEED)
      window.plugin?.setSpeed?.(DEFAULT_SPEED)
    } catch {}
    return true
  }, [])

  const scheduleDefaultSpeed = useCallback(() => {
    if (speedTimer.current) window.clearTimeout(speedTimer.current)
    speedAttempts.current = 0

    const run = () => {
      speedAttempts.current += 1
      if (applyDefaultSpeed() || speedAttempts.current >= SPEED_RETRY_COUNT) {
        speedTimer.current = null
        return
      }
      speedTimer.current = window.setTimeout(run, SPEED_RETRY_MS)
    }
    run()
  }, [applyDefaultSpeed])

  const bootWidget = useCallback(() => {
    if (!window.VLibras) return false

    if (!window.__vlibrasWidgetStarted) {
      new window.VLibras.Widget('https://vlibras.gov.br/app')
      window.__vlibrasWidgetStarted = true
    }

    const widgetMounted = Boolean(
      document.querySelector('[vw-access-button] .vp-access-button') &&
      document.querySelector('[vw-plugin-wrapper] [vp]'),
    )

    if (!widgetMounted && !window.__vlibrasWidgetBooted && typeof window.onload === 'function') {
      window.__vlibrasWidgetBooted = true
      window.onload.call(window, new Event('load'))
    }

    scheduleDefaultSpeed()
    return true
  }, [scheduleDefaultSpeed])

  const openWidget = useCallback(() => {
    bootWidget()
    const wrapper = document.querySelector<HTMLElement>('[vw-plugin-wrapper]')
    const newRoot = document.getElementById('vlibras-app-root')

    if (!wrapper && !newRoot) return false

    if (wrapper) {
      wrapper.classList.add('active')

      if (!window.plugin && window.VLibras?.Plugin) {
        window.plugin = new window.VLibras.Plugin({
          enableMoveWindow: false,
          playWellcome: false,
          rootPath: 'https://vlibras.gov.br/app',
          wrapper,
        })
      }
    }

    window.setTimeout(centerWidget, CENTER_WIDGET_DELAY_MS)
    window.setTimeout(scheduleDefaultSpeed, CENTER_WIDGET_DELAY_MS)
    return true
  }, [bootWidget, centerWidget, scheduleDefaultSpeed])
  const waitForPlugin = useCallback(
    function waitForPlugin(callback: () => void, attempts = 0) {
      if (attempts >= 40) {
        onStatusChange?.('error')
        return
      }

      const oldReady =
        typeof window.plugin?.translate === 'function' && document.querySelector('[vp]')
      const newReady = document.getElementById('vlibras-app-root') !== null

      if (oldReady || newReady) {
        widgetReady.current = true
        setStatus('ready')
        onStatusChange?.('ready')
        callback()
      } else {
        setTimeout(() => waitForPlugin(callback, attempts + 1), 150)
      }
    },
    [onStatusChange],
  )
  const translateNext = useCallback(() => {
    if (translating.current) return true

    const nextText = queue.current.shift()
    if (!nextText) return true

    const hasOldTranslate = typeof window.plugin?.translate === 'function'
    const hasNewRoot = document.getElementById('vlibras-app-root') !== null

    if (!widgetReady.current || (!hasOldTranslate && !hasNewRoot)) {
      queue.current.unshift(nextText)
      onStatusChange?.('error')
      return false
    }

    if (!openWidget()) {
      queue.current.unshift(nextText)
      onStatusChange?.('error')
      return false
    }

    translating.current = true
    onStatusChange?.('translating')
    setStatus('translating')

    applyDefaultSpeed()

    if (hasOldTranslate) {
      window.plugin?.translate?.(nextText)
    }
    centerWidget()

    if (translateTimer.current) window.clearTimeout(translateTimer.current)

    translateTimer.current = window.setTimeout(() => {
      translating.current = false
      translateTimer.current = null
      onStatusChange?.('idle')

      if (!text.trim()) {
        queue.current.push(DEFAULT_TRANSLATION)
      }
      translateNextRef.current()
    }, estimateTranslationTime(nextText))

    return true
  }, [applyDefaultSpeed, centerWidget, estimateTranslationTime, openWidget, onStatusChange, text])

  useEffect(() => {
    translateNextRef.current = translateNext
  }, [translateNext])

  const enqueueTranslation = useCallback(
    (textoAtual: string) => {
      if (!textoAtual?.trim()) return false

      if (textoAtual === lastQueuedText.current && widgetReady.current) {
        return translateNext()
      }

      lastQueuedText.current = textoAtual
      queue.current.push(textoAtual.trim())
      return translateNext()
    },
    [translateNext],
  )

  const triggerTranslation = useCallback(() => {
    const textoAtual = text.trim() || DEFAULT_TRANSLATION
    return enqueueTranslation(textoAtual)
  }, [enqueueTranslation, text])

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true
    setStatus('loading')
    onStatusChange?.('loading')

    const startWidget = () => {
      if (!window.VLibras) return

      bootWidget()

      waitForPlugin(() => {
        if (queue.current.length > 0) {
          translateNextRef.current()
        }
      })

      readyTimer.current = window.setTimeout(() => {
        openWidget()
        centerWidget()
        scheduleDefaultSpeed()
      }, 1200)
    }

    const existingScript = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null

    if (existingScript && existingScript.getAttribute('data-loaded') === 'true') {
      startWidget()
    } else {
      const script = document.createElement('script')
      script.id = SCRIPT_ID
      script.src = SCRIPT_SRC
      script.async = true
      script.setAttribute('data-loaded', 'true')

      script.onload = () => {
        startWidget()
      }
      script.onerror = () => {
        setStatus('error')
        onStatusChange?.('error')
      }

      document.head.appendChild(script)
    }

    return () => {
      if (readyTimer.current) window.clearTimeout(readyTimer.current)
      if (translateTimer.current) window.clearTimeout(translateTimer.current)
      if (speedTimer.current) window.clearTimeout(speedTimer.current)
    }
  }, [bootWidget, centerWidget, openWidget, scheduleDefaultSpeed, waitForPlugin, onStatusChange])

  useEffect(() => {
    const textoAtual = text.trim() || DEFAULT_TRANSLATION

    if (!widgetReady.current) {
      enqueueTranslation(textoAtual)
      return
    }

    let attempt = 0
    let timer: number

    const runTranslation = () => {
      attempt += 1
      if (triggerTranslation() || attempt >= MAX_TRANSLATE_ATTEMPTS) {
        return
      }
      timer = window.setTimeout(runTranslation, READY_RETRY_MS)
    }

    timer = window.setTimeout(runTranslation, TRANSLATE_DELAY_MS)
    return () => window.clearTimeout(timer)
  }, [text, triggerTranslation, enqueueTranslation])

  const rootProps: VLibrasElementProps = {
    vw: ' ',
    className: 'enabled vlibras-widget vlibras-centered',
  }

  const accessButtonProps: VLibrasElementProps = {
    'vw-access-button': ' ',
    className: 'active',
  }

  const wrapperProps: VLibrasElementProps = {
    'vw-plugin-wrapper': ' ',
  }

  return (
    <div {...rootProps}>
      <div {...accessButtonProps} />
      <div {...wrapperProps}>
        <div className="vw-plugin-top-wrapper" />
      </div>
    </div>
  )
}
