import {
  ArrowLeft,
  Bell,
  ChevronLeft,
  ChevronRight,
  Hand,
  Home,
  LoaderCircle,
  LogOut,
  Menu,
  Search,
  Video,
  X,
} from 'lucide-react'
import { useState, type ReactNode } from 'react'
import IconLogo from '../../assets/IconLogo.png'
import type { DashboardUser } from '../../services/authApi'
import type { LucideIcon } from 'lucide-react'
import { initials } from '../../utils/initials'
export default function DashboardShell({
  user: teacher,
  logout,
  navigation,
  onProfile,
  student = false,
  page,
  hasActiveLesson = false,
  breadcrumbs,
  onNavigate,
  onBack,
  onSearch,
  searchPlaceholder = 'Buscar suas turmas...',
  onNotice,
  children,
}: {
  user: DashboardUser | null
  logout: () => Promise<void>
  navigation: ReadonlyArray<{ label: string; icon: LucideIcon }>
  onProfile?: () => void
  student?: boolean
  page: string
  hasActiveLesson?: boolean
  breadcrumbs: { label: string; onClick?: () => void }[]
  onNavigate: (page: string) => void
  onBack?: () => void
  searchPlaceholder?: string
  onSearch: (query: string) => void
  onNotice: (message: string) => void
  children: ReactNode
}) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobile, setMobile] = useState(false)
  const [signingOut, setSigningOut] = useState(false)

  async function handleLogout() {
    if (signingOut) return
    setSigningOut(true)
    try {
      await logout()
    } finally {
      setSigningOut(false)
    }
  }
  return (
    <main
      className={`teacher-app min-h-screen bg-[#F5F7FB] font-text text-slate-800 ${collapsed ? 'sidebar-small' : ''}`}
    >
      {mobile && (
        <button
          aria-label="Fechar navegação"
          className="fixed inset-0 z-40 bg-slate-950/50 md:hidden"
          onClick={() => setMobile(false)}
        />
      )}
      <aside className={`teacher-sidebar ${mobile ? 'mobile-open' : ''}`}>
        <a href="/dashboard" className="flex h-24 items-center gap-3 px-5 text-white">
          <img
            src={IconLogo}
            className="h-11 w-11 rounded-xl object-contain"
            alt="LogoTipo DualLibras.AI"
          />
          {!collapsed && (
            <span className="font-logo text-sm">
              DualLibras<span className="text-blue-300">.AI</span>
            </span>
          )}
        </a>
        <button
          className="t-icon teacher-mobile-menu absolute right-2 top-2"
          aria-label="Fechar menu"
          onClick={() => setMobile(false)}
        >
          <X size={18} />
        </button>
        {!collapsed && (
          <p className="px-7 pb-4 pt-5 text-[10px] font-bold uppercase tracking-[.2em] text-blue-200/50">
            Minha área
          </p>
        )}
        <nav aria-label="Menu principal" className="space-y-1.5 px-3">
          {[
            ...navigation,
            ...(hasActiveLesson ? [{ label: 'Assistir aula', icon: Video }] : []),
          ].map(({ label, icon: Icon }) => (
            <button
              key={label}
              title={collapsed ? label : undefined}
              aria-label={label}
              aria-current={page === label ? 'page' : undefined}
              onClick={() => {
                onNavigate(label)
                setMobile(false)
              }}
              className={`flex w-full items-center gap-3 rounded-xl px-4 py-3.5 text-left text-sm transition ${page === label ? 'bg-primary text-white shadow-lg shadow-black/10' : 'text-blue-100/70 hover:bg-white/10 hover:text-white'}`}
            >
              <Icon size={19} />
              {!collapsed && label}
            </button>
          ))}
        </nav>
        <footer className="mt-auto p-4">
          {!collapsed && (
            <section className="mb-5 rounded-xl border border-white/10 bg-white/5 p-4">
              <Hand size={23} className="mb-3 text-blue-300" />
              <p className="text-sm font-semibold text-white">
                {student ? 'Aprender é conectar.' : 'Ensinar é conectar.'}
              </p>
              <p className="mt-2 text-xs leading-relaxed text-blue-100/60">
                Uma sala de aula com espaço para todas as vozes.
              </p>
            </section>
          )}
          <button
            className="hidden w-full items-center justify-center gap-2 rounded-lg py-3 text-xs text-blue-100/60 hover:bg-white/10 md:flex"
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
          >
            <ChevronLeft size={16} className={collapsed ? 'rotate-180' : ''} />
            {!collapsed && 'Recolher menu'}
          </button>
        </footer>
      </aside>
      <section className="teacher-main">
        <header className="teacher-topbar flex min-h-24 flex-wrap items-center justify-between gap-4 border-b border-slate-200 bg-white px-5 py-4 sm:px-6">
          <button
            className="t-icon teacher-mobile-menu"
            onClick={() => {
              setCollapsed(false)
              setMobile(true)
            }}
            aria-label="Abrir menu"
          >
            <Menu />
          </button>
          <nav
            aria-label="Caminho de navegação"
            className="teacher-breadcrumbs hidden min-w-0 flex-1 md:block"
          >
            <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
              {breadcrumbs.map((item, index) => {
                const current = index === breadcrumbs.length - 1
                return (
                  <li key={`${index}-${item.label}`} className="flex min-w-0 items-center gap-2">
                    {index > 0 && (
                      <ChevronRight
                        size={14}
                        className="shrink-0 text-slate-400"
                        aria-hidden="true"
                      />
                    )}
                    {current ? (
                      <span
                        aria-current="page"
                        title={item.label}
                        className="max-w-48 truncate font-semibold text-primary"
                      >
                        {item.label}
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={item.onClick}
                        title={item.label}
                        className="inline-flex min-h-9 max-w-40 items-center gap-1.5 rounded-md text-slate-500 hover:text-primary"
                      >
                        {index === 0 && <Home size={15} aria-hidden="true" className="shrink-0" />}
                        <span className="truncate">{item.label}</span>
                      </button>
                    )}
                  </li>
                )
              })}
            </ol>
          </nav>
          {!student && (
            <form
              className="teacher-header-search t-search min-w-0 flex-1 md:order-3 md:basis-full xl:order-none xl:max-w-xs xl:basis-auto"
              onSubmit={(event) => {
                event.preventDefault()
                onSearch(String(new FormData(event.currentTarget).get('query') || ''))
              }}
            >
              <Search size={19} className="shrink-0" aria-hidden="true" />
              <input
                name="query"
                aria-label={searchPlaceholder}
                placeholder={searchPlaceholder}
                className="min-w-0 flex-1 bg-transparent text-sm text-slate-700 outline-none"
              />
              <button className="hidden rounded border border-slate-200 px-2 py-1 text-[10px] sm:block">
                Buscar
              </button>
            </form>
          )}
          <section className="flex shrink-0 items-center gap-2 sm:gap-5">
            {!student && (
              <button
                className="t-icon relative"
                aria-label="Notificações"
                onClick={() => onNotice('As notificações ainda não estão disponíveis.')}
              >
                <Bell size={20} />
                <span className="absolute right-2 top-1.5 h-1.5 w-1.5 rounded-full bg-primary" />
              </button>
            )}
            <span className="h-8 border-l border-slate-200" />
            {student ? (
              <div className="flex items-center gap-3 text-left" aria-label="Minha conta">
                <span className="t-avatar">{initials(teacher?.name ?? '')}</span>
                <span className="hidden sm:block">
                  <strong className="block max-w-36 truncate text-xs">{teacher?.name}</strong>
                  <span className="text-[11px] text-slate-400">Aluno</span>
                </span>
              </div>
            ) : (
              <button
                disabled={!onProfile}
                className="flex items-center gap-3 text-left"
                onClick={onProfile}
                aria-label={onProfile ? 'Abrir meu perfil' : 'Minha conta'}
              >
                <span className="t-avatar">{initials(teacher?.name ?? '')}</span>
                <span className="hidden xl:block">
                  <strong className="block max-w-36 truncate text-xs">{teacher?.name}</strong>
                  <span className="text-[11px] text-slate-400">{teacher?.access.roleLabel}</span>
                </span>
              </button>
            )}
            <button
              type="button"
              onClick={() => void handleLogout()}
              disabled={signingOut}
              aria-label={signingOut ? 'Saindo da conta' : 'Sair da conta'}
              title="Sair da conta"
              className="inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-600 transition-colors hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-60"
            >
              {signingOut ? (
                <LoaderCircle size={17} className="animate-spin" aria-hidden="true" />
              ) : (
                <LogOut size={17} aria-hidden="true" />
              )}
              <span className="hidden md:inline">{signingOut ? 'Saindo…' : 'Sair'}</span>
            </button>
          </section>
        </header>
        <section className="mx-auto max-w-[1440px] p-5 sm:p-9">
          {onBack && (
            <button
              onClick={onBack}
              className="mb-5 flex items-center gap-2 text-sm text-slate-500 hover:text-primary md:hidden"
            >
              <ArrowLeft size={16} />
              Voltar
            </button>
          )}
          {children}
        </section>
        <footer className="px-9 pb-6 text-xs text-slate-400">
          DualLibras.AI · Aprendizagem sem barreiras{' '}
          <span className="float-right">Conta conectada</span>
        </footer>
      </section>
    </main>
  )
}
