import { createRequire } from 'node:module'
import { copyFileSync, readdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

const require = createRequire(import.meta.url)
const vad = dirname(require.resolve('@ricky0123/vad-web'))
// Resolve ONNX from VAD itself so runtime JS and binaries use the same version.
const vadRequire = createRequire(require.resolve('@ricky0123/vad-web'))
const ort = dirname(vadRequire.resolve('onnxruntime-web'))
const target = resolve(import.meta.dirname, '../public')
for (const file of readdirSync(ort)) {
  if (/^ort-wasm.*\.(mjs|wasm)$/.test(file)) copyFileSync(resolve(ort, file), resolve(target, file))
}
for (const file of ['silero_vad_v5.onnx', 'vad.worklet.bundle.min.js']) {
  copyFileSync(resolve(vad, file), resolve(target, file))
}
