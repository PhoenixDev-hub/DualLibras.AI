export type Theme = 'light' | 'dark'
export const THEME_KEY = 'duallibras.theme'
const media = window.matchMedia('(prefers-color-scheme: dark)')
const listeners = new Set<() => void>()

function storedPreference(): Theme | null {
  try {
    const value = window.localStorage.getItem(THEME_KEY)
    return value === 'dark' || value === 'light' ? value : null
  } catch {
    return null
  }
}

let preference = storedPreference()
let theme: Theme = preference ?? (media.matches ? 'dark' : 'light')

function applyTheme() {
  document.documentElement.classList.toggle('dark', theme === 'dark')
  document.documentElement.style.colorScheme = theme
}

function updateTheme() {
  theme = preference ?? (media.matches ? 'dark' : 'light')
  applyTheme()
  listeners.forEach((listener) => listener())
}

applyTheme()
media.addEventListener('change', () => {
  if (preference === null) updateTheme()
})
window.addEventListener('storage', (event) => {
  if (event.key === THEME_KEY || event.key === null) {
    preference = storedPreference()
    updateTheme()
  }
})

export function getTheme(): Theme {
  return theme
}

export function subscribeTheme(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function toggleTheme() {
  preference = theme === 'dark' ? 'light' : 'dark'
  try {
    window.localStorage.setItem(THEME_KEY, preference)
  } catch {
    // The switch still works when the browser blocks persistent storage.
  }
  updateTheme()
}
