import type { HTMLAttributes } from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { playUntilFinished, type PlaybackPlayer } from '../utils/playback'
import type { LibrasUtterance } from '../hooks/useLibrasTranscripts'
import { applyPlaybackSpeed } from '../utils/playbackSpeed'
import { takeNextUtterance } from '../utils/nextUtterance'
import { preserveControlClick } from '../utils/preserveControlClick'

type VLibrasProps = {
  utterances: LibrasUtterance[]
  onQueued: (lastId: number) => void
  onPlayingTextChange: (text: string) => void
  interactive?: boolean
  speed?: number
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
      translate?: (text: string) => void | Promise<unknown>
      player?: PlaybackPlayer & {
        stop?: () => void
        setSpeed?: (speed: number) => void
        toggleSubtitles?: (visible: boolean) => void
        showSubtitles?: boolean
      }
      setSpeed?: (speed: number) => void
    }
    vlibras?: PlaybackPlayer & {
      translateAndPlay: (text: string) => Promise<unknown>
      stop: () => void
      setSpeed: (speed: number) => void
    }
    __dualLibrasWelcomed?: boolean
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
const CENTER_WIDGET_DELAY_MS = 300
const SPEED_RETRY_MS = 300
const SPEED_RETRY_COUNT = 15
const WIDGET_WIDTH = '320px'
const WIDGET_HEIGHT = '440px'
const DEFAULT_TRANSLATION = 'Olá! Bem-vindo ao DualLibras.AI.'

function setImportant(element: HTMLElement, property: string, value: string) {
  element.style.setProperty(property, value, 'important')
}

export default function VLibras({
  utterances,
  onQueued,
  onPlayingTextChange,
  onStatusChange,
  interactive = false,
  speed = 1,
}: VLibrasProps) {
  const mounted = useRef(false)
  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
      const root = document.getElementById('vlibras-app-root')
      if (root) {
        root.dataset.active = 'false'
        delete root.dataset.duallibrasLoading
      }
      document.querySelector('[vw-plugin-wrapper]')?.classList.remove('active')
      queue.current = []
      translating.current = false
      widgetReady.current = false
      initialized.current = false
      opening.current = false
      lastQueuedId.current = 0
      playbackAbort.current?.abort()
      window.vlibras?.stop()
      if (!window.vlibras) window.plugin?.player?.stop?.()
      if (readyTimer.current) window.clearTimeout(readyTimer.current)
      if (speedTimer.current) window.clearTimeout(speedTimer.current)
    }
  }, [])

  useEffect(() => {
    document.documentElement.classList.add('vlibras-native-cursor')
    window.addEventListener('click', preserveControlClick, true)
    return () => {
      document.documentElement.classList.remove('vlibras-native-cursor')
      window.removeEventListener('click', preserveControlClick, true)
    }
  }, [])

  const interactiveRef = useRef(interactive)
  const speedRef = useRef(speed)
  const initialized = useRef(false)
  const opening = useRef(false)
  const widgetReady = useRef(false)
  const readyTimer = useRef<number | null>(null)
  const speedTimer = useRef<number | null>(null)
  const speedAttempts = useRef(0)
  const translating = useRef(false)
  const queue = useRef<LibrasUtterance[]>([])
  const lastQueuedId = useRef(0)
  const playbackAbort = useRef<AbortController | null>(null)
  const failed = useRef(false)
  const onQueuedRef = useRef(onQueued)
  useEffect(() => {
    onQueuedRef.current = onQueued
  }, [onQueued])
  const onPlayingTextRef = useRef(onPlayingTextChange)
  useEffect(() => {
    onPlayingTextRef.current = onPlayingTextChange
  }, [onPlayingTextChange])
  const translateNextRef = useRef<() => boolean>(() => true)
  const [status, setStatus] = useState<'idle' | 'loading' | 'translating' | 'error' | 'ready'>(
    'idle',
  )

  useEffect(() => {
    console.debug('[VLibras] Status:', status)
  }, [status])

  const centerWidget = useCallback(() => {
    if (!mounted.current) return
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
      setImportant(wrapper, 'pointer-events', interactiveRef.current ? 'auto' : 'none')
    }

    document
      .querySelectorAll<HTMLElement>(
        '.vpw-box, .vpw-controls, .vpw-playing, .vpw-message-box, .vp-rate-box-content, .vp-rate-box-header, .vp-enabled, .vp-button-change-avatar, .avatar-icaro, .vp-selected',
      )
      .forEach((element) => {
        if (interactiveRef.current) element.style.removeProperty('display')
        else setImportant(element, 'display', 'none')
      })

    if (newRoot && !interactiveRef.current) {
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
            :host, * {
              cursor: auto !important;
            }
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

  useEffect(() => {
    interactiveRef.current = interactive
    document.documentElement.classList.toggle('vlibras-interactive', interactive)
    if (interactive) {
      document.getElementById('vlibras-override-styles')?.remove()
      document.getElementById('vlibras-override-styles-children')?.remove()
      document
        .getElementById('vlibras-app-root')
        ?.shadowRoot?.getElementById('vlibras-override-styles')
        ?.remove()
    }
    centerWidget()
    return () => document.documentElement.classList.remove('vlibras-interactive')
  }, [interactive, centerWidget])

  const applySelectedSpeed = useCallback(() => {
    try {
      return applyPlaybackSpeed(window, speedRef.current)
    } catch (error) {
      console.warn('[VLibras] Não foi possível ajustar a velocidade:', error)
      return false
    }
  }, [])

  useEffect(() => {
    speedRef.current = speed
    applySelectedSpeed()
  }, [speed, applySelectedSpeed])

  const scheduleSelectedSpeed = useCallback(() => {
    if (speedTimer.current) window.clearTimeout(speedTimer.current)
    speedAttempts.current = 0

    const run = () => {
      speedAttempts.current += 1
      if (applySelectedSpeed() || speedAttempts.current >= SPEED_RETRY_COUNT) {
        speedTimer.current = null
        return
      }
      speedTimer.current = window.setTimeout(run, SPEED_RETRY_MS)
    }
    run()
  }, [applySelectedSpeed])

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

    if (!opening.current && window.VLibrasWidget?.open) {
      opening.current = true
      window.VLibrasWidget.open()
    }
    scheduleSelectedSpeed()
    return true
  }, [scheduleSelectedSpeed])

  const openWidget = useCallback(() => {
    if (!mounted.current) return false
    bootWidget()
    const wrapper = document.querySelector<HTMLElement>('[vw-plugin-wrapper]')
    const newRoot = document.getElementById('vlibras-app-root')

    if (!wrapper && !newRoot) return false
    if (newRoot) newRoot.dataset.active = 'true'

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
    window.setTimeout(scheduleSelectedSpeed, CENTER_WIDGET_DELAY_MS)
    return true
  }, [bootWidget, centerWidget, scheduleSelectedSpeed])
  const waitForPlugin = useCallback(
    function waitForPlugin(callback: () => void, attempts = 0) {
      if (!mounted.current) return
      if (attempts >= 240) {
        setStatus('error')
        onStatusChange?.('error')
        return
      }

      // translate is exposed by the current widget after the player loads.
      // Welcome flags are optional and can remain false after a reload/stop.
      const root = document.getElementById('vlibras-app-root')
      if (root) delete root.dataset.duallibrasLoading
      const ready = typeof window.plugin?.translate === 'function'

      if (ready) {
        if (root) delete root.dataset.duallibrasLoading
        widgetReady.current = true
        setStatus('ready')
        onStatusChange?.('ready')
        callback()
      } else {
        bootWidget()
        readyTimer.current = window.setTimeout(() => waitForPlugin(callback, attempts + 1), 250)
      }
    },
    [onStatusChange, bootWidget],
  )
  const translateNext = useCallback(() => {
    if (!mounted.current || failed.current) return false
    if (translating.current || !widgetReady.current) return true
    const next = takeNextUtterance(queue.current)
    if (!next) return true
    const nextText = next.text
    if (!openWidget()) {
      queue.current.unshift(next)
      return false
    }
    const controller = new AbortController()
    playbackAbort.current = controller
    translating.current = true
    setStatus('translating')
    onStatusChange?.('translating')
    onPlayingTextRef.current(nextText)
    applySelectedSpeed()
    void playUntilFinished(
      () => window.plugin!.translate!(nextText),
      () => window.vlibras ?? window.plugin?.player,
      controller.signal,
    )
      .then(() => {
        if (controller.signal.aborted || !mounted.current) return
        translating.current = false
        setStatus('idle')
        onStatusChange?.('idle')
        onPlayingTextRef.current('')
        if (next.id === 0) window.__dualLibrasWelcomed = true
        else onQueuedRef.current(next.id)
        translateNextRef.current()
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted || !mounted.current) return
        console.error('[VLibras] Falha na reprodução:', error)
        failed.current = true
        translating.current = false
        queue.current.unshift(next)
        setStatus('error')
        onStatusChange?.('error')
      })
    return true
  }, [applySelectedSpeed, openWidget, onStatusChange])

  useEffect(() => {
    translateNextRef.current = translateNext
  }, [translateNext])

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true
    failed.current = false
    if (!window.__dualLibrasWelcomed) queue.current.unshift({ id: 0, text: DEFAULT_TRANSLATION })
    setStatus('loading')
    onStatusChange?.('loading')

    const startWidget = () => {
      if (!mounted.current) return
      if (!window.VLibras) return

      bootWidget()

      waitForPlugin(() => {
        if (queue.current.length > 0) {
          translateNextRef.current()
        }
      })

      openWidget()
      centerWidget()
    }

    let cancelled = false
    let script = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null
    if (script?.dataset.failed === 'true') {
      script.remove()
      script = null
    }
    const handleLoad = () => {
      if (script) script.dataset.loaded = 'true'
      if (!cancelled) startWidget()
    }
    const handleError = () => {
      if (script) script.dataset.failed = 'true'
      if (cancelled) return
      setStatus('error')
      onStatusChange?.('error')
    }
    let timeout: number | undefined
    if (window.VLibras) {
      startWidget()
    } else {
      const needsAppend = !script
      if (!script) {
        script = document.createElement('script')
        script.id = SCRIPT_ID
        script.src = SCRIPT_SRC
        script.async = true
      }
      script.addEventListener('load', handleLoad)
      script.addEventListener('error', handleError)
      timeout = window.setTimeout(() => {
        if (!window.VLibras) handleError()
      }, 30000)
      if (needsAppend) document.head.appendChild(script)
    }

    return () => {
      cancelled = true
      window.clearTimeout(timeout)
      script?.removeEventListener('load', handleLoad)
      script?.removeEventListener('error', handleError)
      if (readyTimer.current) window.clearTimeout(readyTimer.current)
      if (speedTimer.current) window.clearTimeout(speedTimer.current)
    }
  }, [bootWidget, centerWidget, openWidget, scheduleSelectedSpeed, waitForPlugin, onStatusChange])

  useEffect(() => {
    const pending = utterances.filter(({ id }) => id > lastQueuedId.current)
    if (!pending.length) return
    queue.current.push(...pending)
    lastQueuedId.current = pending[pending.length - 1].id
    translateNextRef.current()
  }, [utterances, onQueued])

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
