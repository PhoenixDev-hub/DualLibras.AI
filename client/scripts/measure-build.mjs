// Run after `npm run build`. Measures the entry and preloads, not navigation or LCP.
import { readFileSync } from 'node:fs'
import { gzipSync } from 'node:zlib'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../dist/', import.meta.url))
const html = readFileSync(resolve(root, 'index.html'), 'utf8')
const paths = [
  ...new Set(
    [...html.matchAll(/(?:src|href)="\.\/(assets\/[^"?]+\.(?:js|css))"/g)].map((match) => match[1]),
  ),
]
const assets = paths.map((path) => {
  const buffer = readFileSync(resolve(root, path))
  return { path, bytes: buffer.length, gzipBytes: gzipSync(buffer, { level: 9 }).length }
})
const totals = (extension) =>
  assets
    .filter((asset) => asset.path.endsWith(extension))
    .reduce(
      (total, asset) => ({
        bytes: total.bytes + asset.bytes,
        gzipBytes: total.gzipBytes + asset.gzipBytes,
      }),
      { bytes: 0, gzipBytes: 0 },
    )
console.log(JSON.stringify({ javascript: totals('.js'), css: totals('.css'), assets }, null, 2))
