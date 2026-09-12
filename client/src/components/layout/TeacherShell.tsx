import { useState, type ReactNode } from 'react'
import {
  ArrowLeft,
  Bell,
  BookOpen,
  ChevronLeft,
  GraduationCap,
  Hand,
  Home,
  LayoutGrid,
  Menu,
  Search,
  Settings,
  Users,
  Video,
  X,
} from 'lucide-react'
import LogoTipo from '../../assets/Logotipo.png'
import { teacher } from '../../data/teacherDemo'
const navigation = [
  { label: 'Início', icon: Home },
  { label: 'Minhas turmas', icon: LayoutGrid },
  { label: 'Minhas aulas', icon: Video },
  { label: 'Meus alunos', icon: Users },
  { label: 'Materiais', icon: BookOpen },
  { label: 'Glossário', icon: GraduationCap },
  { label: 'Aprender Libras', icon: Hand },
  { label: 'Configurações', icon: Settings },
]
export default function TeacherShell({
  page,
  onNavigate,
  onBack,
  onSearch,
  onNotice,
  children,
}: {
  page: string
  onNavigate: (page: string) => void
  onBack?: () => void
  onSearch: (query: string) => void
  onNotice: (message: string) => void
  children: ReactNode
}) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobile, setMobile] = useState(false)
  return (
    <main
      className={`teacher-app min-h-screen bg-[#F5F7FB] font-text text-slate-800 ${collapsed ? 'sidebar-small' : ''}`}
    >
      {mobile && (
        <button
          aria-label="Fechar navegação"
          className="fixed inset-0 z-40 bg-slate-950/50 lg:hidden"
          onClick={() => setMobile(false)}
        />
      )}
      <aside className={`teacher-sidebar ${mobile ? 'mobile-open' : ''}`}>
        <a href="/dashboard" className="flex h-24 items-center gap-3 px-5 text-white">
          <img
            src={LogoTipo}
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
          className="t-icon absolute right-2 top-2 lg:hidden"
          aria-label="Fechar menu"
          onClick={() => setMobile(false)}
        >
          <X size={18} />
        </button>
        {!collapsed && (
          <p className="px-7 pb-4 pt-5 text-[10px] font-bold uppercase tracking-[.2em] text-blue-200/50">
            Espaço do professor
          </p>
        )}
        <nav aria-label="Menu principal" className="space-y-1.5 px-3">
          {navigation.map(({ label, icon: Icon }) => (
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
              <p className="text-sm font-semibold text-white">Ensinar é conectar.</p>
              <p className="mt-2 text-xs leading-relaxed text-blue-100/60">
                Uma sala de aula com espaço para todas as vozes.
              </p>
            </section>
          )}
          <button
            className="hidden w-full items-center justify-center gap-2 rounded-lg py-3 text-xs text-blue-100/60 hover:bg-white/10 lg:flex"
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
          >
            <ChevronLeft size={16} className={collapsed ? 'rotate-180' : ''} />
            {!collapsed && 'Recolher menu'}
          </button>
        </footer>
      </aside>
      <section className="teacher-main">
        <header className="flex h-24 items-center justify-between gap-4 border-b border-slate-200 bg-white px-5 sm:px-9">
          <button
            className="t-icon lg:hidden"
            onClick={() => {
              setCollapsed(false)
              setMobile(true)
            }}
            aria-label="Abrir menu"
          >
            <Menu />
          </button>
          <form
            className="flex max-w-lg flex-1 items-center gap-3 text-slate-400"
            onSubmit={(event) => {
              event.preventDefault()
              onSearch(String(new FormData(event.currentTarget).get('query') || ''))
            }}
          >
            <Search size={19} />
            <input
              name="query"
              aria-label="Buscar turmas"
              placeholder="Buscar suas turmas..."
              className="min-w-0 flex-1 bg-transparent text-sm text-slate-700 outline-none"
            />
            <button className="hidden rounded border border-slate-200 px-2 py-1 text-[10px] sm:block">
              Buscar
            </button>
          </form>
          <section className="flex items-center gap-3 sm:gap-5">
            <button
              className="t-icon relative"
              aria-label="Notificações"
              onClick={() =>
                onNotice('Você está em dia! Nenhuma nova notificação nesta demonstração.')
              }
            >
              <Bell size={20} />
              <span className="absolute right-2 top-1.5 h-1.5 w-1.5 rounded-full bg-primary" />
            </button>
            <span className="h-8 border-l border-slate-200" />
            <button
              className="flex items-center gap-3 text-left"
              onClick={() => onNavigate('Configurações')}
              aria-label="Abrir perfil do professor"
            >
              <span className="t-avatar">MO</span>
              <span className="hidden sm:block">
                <strong className="block text-xs">{teacher.name}</strong>
                <span className="text-[11px] text-slate-400">Professor</span>
              </span>
            </button>
          </section>
        </header>
        <section className="mx-auto max-w-[1440px] p-5 sm:p-9">
          {onBack && (
            <button
              onClick={onBack}
              className="mb-5 flex items-center gap-2 text-sm text-slate-500 hover:text-primary"
            >
              <ArrowLeft size={16} />
              Voltar
            </button>
          )}
          {children}
        </section>
        <footer className="px-9 pb-6 text-xs text-slate-400">
          DualLibras.AI · Aprendizagem sem barreiras{' '}
          <span className="float-right">Demonstração visual</span>
        </footer>
      </section>
    </main>
  )
}
