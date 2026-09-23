import { test } from 'node:test'
import assert from 'node:assert/strict'
import vm from 'node:vm'
import { readFileSync } from 'node:fs'
import ts from 'typescript'

const source = readFileSync(new URL('../src/features/theme/theme.ts', import.meta.url), 'utf8')
const bootstrap = readFileSync(new URL('../index.html', import.meta.url), 'utf8').match(
  /<script>([\s\S]*?)<\/script>/,
)[1]
const code = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText
function environment({ stored = null, dark = false, blocked = false } = {}) {
  const events = {}
  const classes = new Set()
  const media = {
    matches: dark,
    addEventListener: (_, listener) => {
      events.media = listener
    },
  }
  const storage = {
    getItem: () => {
      if (blocked) throw new Error('Storage blocked')
      return stored
    },
    setItem: (_, value) => {
      if (blocked) throw new Error('Storage blocked')
      stored = value
    },
  }
  const root = {
    style: {},
    classList: { toggle: (name, on) => (on ? classes.add(name) : classes.delete(name)) },
  }
  const context = {
    exports: {},
    document: { documentElement: root },
    localStorage: storage,
    matchMedia: () => media,
    window: {
      localStorage: storage,
      matchMedia: () => media,
      addEventListener: (name, fn) => {
        events[name] = fn
      },
    },
  }
  vm.runInNewContext(bootstrap, context)
  const initial = classes.has('dark')
  vm.runInNewContext(code, context)
  return {
    api: context.exports,
    root,
    classes,
    initial,
    system(value) {
      media.matches = value
      events.media()
    },
    otherTab(value) {
      stored = value
      events.storage({ key: 'duallibras.theme' })
    },
    saved: () => stored,
  }
}

test('system preference is applied before rendering and follows system changes', () => {
  const e = environment({ dark: true })
  assert.equal(e.initial, true)
  assert.equal(e.api.getTheme(), 'dark')
  e.system(false)
  assert.equal(e.api.getTheme(), 'light')
  assert.equal(e.root.style.colorScheme, 'light')
})
test('manual choice persists and overrides the OS on reload', () => {
  const e = environment({ dark: true })
  e.api.toggleTheme()
  assert.equal(e.saved(), 'light')
  e.system(true)
  assert.equal(e.api.getTheme(), 'light')
  const reload = environment({ stored: e.saved(), dark: true })
  assert.equal(reload.initial, false)
  assert.equal(reload.api.getTheme(), 'light')
})
test('tabs synchronize preference and clearing it returns to system', () => {
  const e = environment({ dark: false })
  let updates = 0
  const unsubscribe = e.api.subscribeTheme(() => updates++)
  e.otherTab('dark')
  assert.equal(e.api.getTheme(), 'dark')
  assert.equal(updates, 1)
  unsubscribe()
  e.otherTab(null)
  assert.equal(e.api.getTheme(), 'light')
  assert.equal(updates, 1)
})
test('blocked local storage does not break initialization or switching', () => {
  const e = environment({ dark: true, blocked: true })
  e.api.toggleTheme()
  assert.equal(e.api.getTheme(), 'light')
  e.system(true)
  assert.equal(e.api.getTheme(), 'light')
})
test('invalid stored values fall back to the system before and after boot', () => {
  const e = environment({ stored: 'invalid', dark: true })
  assert.equal(e.initial, true)
  assert.equal(e.api.getTheme(), 'dark')
})
