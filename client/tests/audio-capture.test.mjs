import { test } from 'node:test'
import assert from 'node:assert/strict'
import vm from 'node:vm'
import { readFileSync } from 'node:fs'
import ts from 'typescript'

function harness({ denied = false, pending = false } = {}) {
  const effects = [],
    sockets = [],
    tracks = [],
    encoders = [],
    contexts = []
  let resolveStream,
    gumCalls = 0
  const stream = () => {
    const track = {
      stopped: false,
      stop() {
        this.stopped = true
      },
    }
    tracks.push(track)
    return { getTracks: () => [track] }
  }
  const node = () => ({ connect() {} })
  class Socket {
    static OPEN = 1
    static CLOSED = 3
    readyState = 1
    bufferedAmount = 0
    sent = []
    constructor() {
      sockets.push(this)
    }
    send(data) {
      this.sent.push(data)
    }
    close() {
      this.readyState = 3
      this.onclose?.()
    }
  }
  class Context {
    sampleRate = 16000
    state = 'running'
    audioWorklet = { addModule: async () => {} }
    constructor() {
      contexts.push(this)
    }
    async resume() {}
    async close() {
      this.state = 'closed'
    }
    createMediaStreamSource() {
      return node()
    }
    createMediaStreamDestination() {
      return { ...node(), stream: {} }
    }
    createAnalyser() {
      return { ...node(), frequencyBinCount: 128, getByteFrequencyData() {} }
    }
  }
  let source = readFileSync(
    new URL('../src/features/transcription/hooks/useAudioCapture.ts', import.meta.url),
    'utf8',
  )
  source = source.replace("await import('@ricky0123/vad-web')", 'await Promise.resolve(vadModule)')
  const code = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText
  const sandbox = {
    exports: {},
    console,
    DOMException,
    ArrayBuffer,
    Uint8Array,
    require(name) {
      if (name === 'react')
        return {
          useCallback: (fn) => fn,
          useRef: (current) => ({ current }),
          useState: (v) => [v, () => {}],
          useEffect: (fn) => effects.push(fn),
        }
      if (name.includes('config/backend')) return { WS_URL: 'ws://mock.invalid' }
      return { parseTranscriptMessage: (x) => x }
    },
    navigator: {
      mediaDevices: {
        enumerateDevices: async () => [],
        getUserMedia: async () => {
          gumCalls++
          if (denied) throw new DOMException('Permission denied', 'NotAllowedError')
          if (pending)
            return new Promise((resolve) => {
              resolveStream = () => resolve(stream())
            })
          return stream()
        },
      },
    },
    WebSocket: Socket,
    AudioContext: Context,
    AudioWorkletNode: class {
      port = {}
      constructor() {
        encoders.push(this)
      }
      connect() {}
    },
    vadModule: {
      MicVAD: { new: async () => ({ start: async () => {}, destroy: async () => {} }) },
    },
    requestAnimationFrame() {},
  }
  vm.runInNewContext(code, sandbox)
  const messages = []
  const capture = sandbox.exports.useAudioCapture({ onTranscript: (x) => messages.push(x) })
  const cleanups = effects.map((fn) => fn()).filter(Boolean)
  return {
    capture,
    sockets,
    tracks,
    contexts,
    encoders,
    messages,
    cleanups,
    resolve: () => resolveStream(),
    calls: () => gumCalls,
  }
}

test('mount is free; double start opens once; PCM and transcript travel; stop blocks late audio', async () => {
  const h = harness()
  assert.equal(h.sockets.length, 0)
  assert.equal(h.calls(), 0)
  await Promise.all([h.capture.iniciarCaptura(), h.capture.iniciarCaptura()])
  assert.equal(h.calls(), 1)
  assert.equal(h.sockets.length, 1)
  const send = h.encoders[0].port.onmessage
  send({ data: { type: 'audio', buffer: new ArrayBuffer(1600) } })
  assert.equal(h.sockets[0].sent.length, 1)
  for (const is_final of [false, true])
    await h.sockets[0].onmessage({
      data: JSON.stringify({ type: 'transcript', text: 'Bom dia', is_final }),
    })
  assert.equal(h.messages.length, 2)
  await h.capture.pararCaptura()
  send({ data: { type: 'audio', buffer: new ArrayBuffer(1600) } })
  assert.equal(h.sockets[0].sent.length, 1)
  assert.equal(h.sockets[0].readyState, 3)
  assert.ok(h.tracks.every((t) => t.stopped))
  assert.ok(h.contexts.every((c) => c.state === 'closed'))
})

test('denied permission never opens a socket', async () => {
  const h = harness({ denied: true })
  await h.capture.iniciarCaptura()
  assert.equal(h.sockets.length, 0)
})

test('unmount while permission is pending stops the late stream', async () => {
  const h = harness({ pending: true })
  const start = h.capture.iniciarCaptura()
  h.cleanups.forEach((fn) => fn())
  h.resolve()
  await start
  assert.ok(h.tracks.every((t) => t.stopped))
  assert.equal(h.sockets.length, 0)
})

test('provider error closes capture without reconnecting', async () => {
  const h = harness()
  await h.capture.iniciarCaptura()
  await h.sockets[0].onmessage({ data: JSON.stringify({ type: 'error', text: 'Indisponível' }) })
  assert.ok(h.tracks.every((t) => t.stopped))
  assert.equal(h.sockets[0].readyState, 3)
  assert.equal(h.sockets.length, 1)
})

test('PCM worklet preserves signal and silence as mono PCM16, 50ms per chunk', () => {
  let Processor
  const outputs = []
  vm.runInNewContext(
    readFileSync(new URL('../public/pcm-encoder-worklet.js', import.meta.url), 'utf8'),
    {
      AudioWorkletProcessor: class {
        port = { postMessage: (data) => outputs.push(data.buffer) }
      },
      registerProcessor: (_, impl) => {
        Processor = impl
      },
      Int16Array,
    },
  )
  const encoder = new Processor()
  const samples = Float32Array.from({ length: 1600 }, (_, i) =>
    i < 800 ? 0.5 * Math.sin((2 * Math.PI * 440 * i) / 16000) : 0,
  )
  for (let offset = 0; offset < samples.length; offset += 128)
    encoder.process([[samples.slice(offset, offset + 128)]])
  assert.equal(outputs.length, 2)
  assert.equal(outputs[0].byteLength, 1600)
  const signal = new Int16Array(outputs[0])
  const rms = Math.sqrt(signal.reduce((sum, x) => sum + x * x, 0) / signal.length)
  assert.ok(rms > 11000 && rms < 12000)
  assert.ok(new Int16Array(outputs[1]).every((x) => x === 0))
})
