import { useCallback, useEffect, useRef, useState } from 'react'
import type { MicVAD } from '@ricky0123/vad-web'
import { WS_URL } from '../../../config/backend'
import { parseTranscriptMessage, type TranscriptMessage } from '../services/websocket'

type ConnectionMode = 'assemblyai' | 'local' | 'offline'
type TranscriptionProvider = Exclude<ConnectionMode, 'offline'>

type UseAudioCaptureOptions = {
  onTranscript: (message: TranscriptMessage) => void
  lessonId?: string | number
}

export function useAudioCapture({ onTranscript, lessonId }: UseAudioCaptureOptions) {
  const onTranscriptRef = useRef(onTranscript)
  useEffect(() => {
    onTranscriptRef.current = onTranscript
  }, [onTranscript])
  const captureGeneration = useRef(0)
  const [conectado, setConectado] = useState(false)
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([])
  const [selectedDevice, setSelectedDevice] = useState<string>('')
  const [capturing, setCapturing] = useState(false)
  const [audioError, setAudioError] = useState<string>('')
  const [audioLevel, setAudioLevel] = useState<number>(0)
  const [speaking, setSpeaking] = useState(false)
  const [latencyMs, setLatencyMs] = useState<number>(0)
  const [latencyAlert, setLatencyAlert] = useState(false)
  const [connectionMode, setConnectionMode] = useState<ConnectionMode>('offline')
  const [useVadGating, setUseVadGating] = useState<boolean>(false)

  const audioContextRef = useRef<AudioContext | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const encoderNodeRef = useRef<AudioWorkletNode | null>(null)
  const vadRef = useRef<MicVAD | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const speakingRef = useRef<boolean>(false)
  const lastSendTimeRef = useRef<number>(0)
  const useVadGatingRef = useRef<boolean>(false)
  const startingRef = useRef(false)

  useEffect(() => {
    useVadGatingRef.current = useVadGating
    speakingRef.current = speaking
  }, [useVadGating, speaking])

  const handleTranscriptPayload = (payload: unknown) => {
    const message = parseTranscriptMessage(payload)
    const rtt = Date.now() - lastSendTimeRef.current
    setLatencyMs(rtt)
    setLatencyAlert(rtt > 500)
    onTranscriptRef.current(message)
  }

  const conectarSocket = () => {
    if (wsRef.current && wsRef.current.readyState !== WebSocket.CLOSED) {
      return
    }

    console.log(`[WebSocket] Conectando ao backend em ${WS_URL}`)
    const ws = new WebSocket(lessonId ? `${WS_URL}${WS_URL.includes('?') ? '&' : '?'}lesson_id=${encodeURIComponent(lessonId)}` : WS_URL)
    wsRef.current = ws

    ws.onopen = () => {
      console.log('[WebSocket] Conectado ao backend')
      // Abertura do transporte não confirma disponibilidade da IA.
    }

    ws.onmessage = async (event) => {
      try {
        const data = JSON.parse(event.data)

        if (data.type === 'status') {
          setConectado(Boolean(data.connected))
          setConnectionMode(data.mode || 'offline')
        } else if (data.type === 'error') {
          if (data.mode === 'assemblyai' || data.mode === 'local') {
            setConnectionMode(data.mode)
          }
          setAudioError(data.text || 'O provedor de transcrição não está disponível.')
          void pararCaptura()
        } else if (data.type === 'transcript') {
          handleTranscriptPayload(data)
        }
      } catch (error) {
        console.error('[WebSocket] Erro ao parsear mensagem:', error)
      }
    }

    ws.onerror = (error) => {
      console.error('[WebSocket] Erro:', error)
    }

    ws.onclose = () => {
      if (wsRef.current !== ws) return
      setAudioError('Conexão encerrada. Inicie novamente para tentar outra vez.')
      void pararCaptura()
    }
  }

  const carregarDispositivos = useCallback(async () => {
    if (!navigator.mediaDevices?.enumerateDevices) return
    try {
      const devs = await navigator.mediaDevices.enumerateDevices()
      const audioDevs = devs.filter((device) => device.kind === 'audioinput')
      setDevices(audioDevs)
      setSelectedDevice((current) => current || audioDevs[0]?.deviceId || '')
    } catch (error) {
      console.warn('Erro ao listar dispositivos de áudio:', error)
    }
  }, [])

  const iniciarCaptura = async (deviceId = selectedDevice) => {
    if (startingRef.current || streamRef.current) return
    startingRef.current = true
    const generation = ++captureGeneration.current
    try {
      setAudioError('')
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Microfone indisponível. Use HTTPS ou localhost.')
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          deviceId: deviceId ? { exact: deviceId } : undefined,
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          latency: 0.01,
        } as MediaTrackConstraints,
      })
      if (generation !== captureGeneration.current) {
        stream.getTracks().forEach((track) => track.stop())
        return
      }
      streamRef.current = stream
      stream.getTracks().forEach((track) => {
        track.onended = () => {
          if (generation !== captureGeneration.current) return
          setAudioError('Microfone desconectado ou captura interrompida.')
          void pararCaptura()
        }
      })

      const ctx = new AudioContext({ sampleRate: 16000 })
      audioContextRef.current = ctx

      await ctx.resume()
      if (ctx.sampleRate !== 16000)
        throw new Error('O navegador não disponibilizou áudio a 16 kHz.')
      if (generation !== captureGeneration.current) return
      await ctx.audioWorklet.addModule('/pcm-encoder-worklet.js')
      if (generation !== captureGeneration.current) return

      const source = ctx.createMediaStreamSource(stream)

      const encoderNode = new AudioWorkletNode(ctx, 'pcm-encoder', {
        channelCount: 1,
        channelCountMode: 'explicit',
      })
      encoderNodeRef.current = encoderNode

      const analyser = ctx.createAnalyser()
      analyser.fftSize = 256
      analyserRef.current = analyser

      source.connect(encoderNode)
      source.connect(analyser)
      encoderNode.connect(ctx.destination)

      encoderNode.port.onmessage = (event) => {
        if (generation !== captureGeneration.current || event.data.type !== 'audio') return

        // Keep the audio clock running: the streaming recognizer needs silence
        // to detect end_of_turn. Gating removes noise, not time from the stream.
        const capturedBuffer: ArrayBuffer = event.data.buffer
        const buffer =
          useVadGatingRef.current && !speakingRef.current
            ? new ArrayBuffer(capturedBuffer.byteLength)
            : capturedBuffer
        lastSendTimeRef.current = Date.now()

        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          if (wsRef.current.bufferedAmount > 64000) {
            setAudioError('Envio de áudio atrasado. Inicie novamente.')
            void pararCaptura()
            return
          }
          wsRef.current.send(buffer)
        }
      }

      try {
        const dest = ctx.createMediaStreamDestination()
        source.connect(dest)

        const { MicVAD } = await import('@ricky0123/vad-web')
        const myvad = await MicVAD.new({
          audioContext: ctx,
          getStream: () => Promise.resolve(dest.stream),
          baseAssetPath: '/',
          onnxWASMBasePath: '/',
          model: 'v5',
          startOnLoad: false,
          onVADMisfire: () => {
            if (generation !== captureGeneration.current) return
            setSpeaking(false)
            speakingRef.current = false
          },
          positiveSpeechThreshold: 0.35,
          onSpeechStart: () => {
            if (generation !== captureGeneration.current) return
            setSpeaking(true)
            speakingRef.current = true
          },
          onSpeechEnd: () => {
            if (generation !== captureGeneration.current) return
            setSpeaking(false)
            speakingRef.current = false
          },
        })
        if (generation !== captureGeneration.current) {
          await myvad.destroy()
          return
        }
        vadRef.current = myvad
        await myvad.start()
      } catch (vadError) {
        if (generation !== captureGeneration.current) return
        console.warn('VAD falhou ao iniciar. Usando envio contínuo como fallback.', vadError)
        setSpeaking(true)
        speakingRef.current = true
      }

      if (generation !== captureGeneration.current) return
      const bufferLength = analyser.frequencyBinCount
      const dataArray = new Uint8Array(bufferLength)
      const updateLevel = () => {
        if (generation !== captureGeneration.current || !analyserRef.current || !streamRef.current)
          return
        analyserRef.current.getByteFrequencyData(dataArray)
        let sum = 0
        for (let index = 0; index < bufferLength; index += 1) {
          sum += dataArray[index]
        }
        setAudioLevel(sum / bufferLength)
        requestAnimationFrame(updateLevel)
      }
      updateLevel()

      conectarSocket()
      setCapturing(true)
      startingRef.current = false
      void carregarDispositivos()
    } catch (error: unknown) {
      if (generation !== captureGeneration.current) return
      await pararCaptura()
      console.error('Falha ao iniciar captura de áudio:', error)
      const audioException = error instanceof DOMException ? error : null
      const errorName = audioException?.name ?? 'Error'
      const errorMessage = error instanceof Error ? error.message : 'Falha desconhecida'

      if (errorName === 'NotAllowedError' || errorMessage.includes('Permission denied')) {
        setAudioError(
          'Permissão negada. Conceda acesso ao microfone nas configurações do navegador.',
        )
      } else if (errorName === 'NotFoundError' || errorName === 'DevicesNotFoundError') {
        setAudioError('Microfone não encontrado. Conecte um dispositivo de entrada.')
      } else if (errorName === 'NotReadableError' || errorName === 'TrackStartError') {
        setAudioError('Microfone ocupado por outra aplicação.')
      } else {
        setAudioError(`Erro no áudio: ${errorMessage || errorName}`)
      }
    }
  }

  const pararCaptura = async () => {
    captureGeneration.current += 1
    startingRef.current = false
    const ws = wsRef.current
    wsRef.current = null
    if (ws) {
      ws.onclose = null
      ws.onmessage = null
      ws.onopen = null
      ws.close()
    }
    setConectado(false)
    setConnectionMode('offline')
    const ctx = audioContextRef.current
    audioContextRef.current = null
    if (encoderNodeRef.current) encoderNodeRef.current.port.onmessage = null
    encoderNodeRef.current = null
    analyserRef.current = null
    setCapturing(false)
    setSpeaking(false)
    speakingRef.current = false
    setAudioLevel(0)

    const stream = streamRef.current
    streamRef.current = null
    stream?.getTracks().forEach((track) => track.stop())

    const vad = vadRef.current
    vadRef.current = null
    if (vad) {
      try {
        await vad.destroy()
      } catch (error) {
        console.warn('Falha ao encerrar detector de voz:', error)
      }
    }

    if (ctx && ctx.state !== 'closed') await ctx.close().catch(console.warn)
  }

  const switchTranscriptionProvider = (provider?: TranscriptionProvider) => {
    const nextProvider = provider ?? (connectionMode === 'assemblyai' ? 'local' : 'assemblyai')

    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      setAudioError(
        'Backend de transcrição desconectado. Inicie a captura antes de trocar o motor.',
      )
      return
    }

    setAudioError('')
    wsRef.current.send(
      JSON.stringify({
        type: 'set_provider',
        provider: nextProvider,
      }),
    )
  }

  useEffect(() => {
    void carregarDispositivos()
  }, [carregarDispositivos])

  useEffect(() => {
    return () => {
      void pararCaptura()
    }
  }, [])

  const selectDevice = (deviceId: string) => {
    setSelectedDevice(deviceId)
    if (capturing) {
      pararCaptura().then(() => iniciarCaptura(deviceId))
    }
  }

  return {
    conectado,
    devices,
    selectedDevice,
    setSelectedDevice: selectDevice,
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
  }
}
