import { useSyncExternalStore } from 'react'
import { Moon, Sun } from 'lucide-react'
import { getTheme, subscribeTheme, toggleTheme } from './theme'

export default function ThemeToggle({ className = '' }: { className?: string }) {
  const theme = useSyncExternalStore(subscribeTheme, getTheme)
  const label = theme === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro'
  return (
    <button
      type="button"
      className={`theme-toggle ${className}`}
      onClick={toggleTheme}
      aria-label={label}
      title={label}
    >
      {theme === 'dark' ? (
        <Sun size={20} aria-hidden="true" />
      ) : (
        <Moon size={20} aria-hidden="true" />
      )}
    </button>
  )
}
