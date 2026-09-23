import ThemeToggle from '../../theme/ThemeToggle'
import ProjectLogo from '../../../components/brand/ProjectLogo'
import { Menu, X } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'

const navItems = [
  { label: 'Início', href: '#inicio' },
  { label: 'Como funciona', href: '#funcionamento' },
  { label: 'Dicionário', href: '#dicionario' },
  { label: 'Sobre o projeto', href: '#impacto' },
]

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false)
  return (
    <header className="edu-header">
      <a className="edu-skip-link" href="#conteudo">
        Ir para o conteúdo
      </a>
      <div className="edu-container edu-header-inner">
        <Link to="/" className="edu-brand" aria-label="DualLibras — início">
          <ProjectLogo />
        </Link>
        <div className="edu-header-actions">
          <nav className="edu-desktop-nav" aria-label="Navegação principal">
            {navItems.map((item) => (
              <a href={item.href} key={item.href}>
                {item.label}
              </a>
            ))}
            <Link to="/entrar" className="edu-button edu-button-small">
              Entrar
            </Link>
          </nav>
          <ThemeToggle />
          <button
            className="edu-menu-toggle"
            onClick={() => setMobileOpen((value) => !value)}
            aria-expanded={mobileOpen}
            aria-controls="edu-mobile-nav"
            aria-label={mobileOpen ? 'Fechar menu' : 'Abrir menu'}
          >
            {mobileOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>
      <nav
        id="edu-mobile-nav"
        className="edu-mobile-nav"
        aria-label="Navegação mobile"
        hidden={!mobileOpen}
        onKeyDown={(event) => {
          if (event.key === 'Escape') setMobileOpen(false)
        }}
      >
        {navItems.map((item) => (
          <a href={item.href} key={item.href} onClick={() => setMobileOpen(false)}>
            {item.label}
          </a>
        ))}
        <Link to="/entrar" onClick={() => setMobileOpen(false)}>
          Entrar na minha conta
        </Link>
        <Link to="/cadastrar" onClick={() => setMobileOpen(false)}>
          Criar minha conta
        </Link>
      </nav>
    </header>
  )
}
