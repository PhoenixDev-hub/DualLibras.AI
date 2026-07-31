import { Bell, Menu, Moon, Search } from 'lucide-react'
import { type DashboardSection, menuItems } from './dashboardData'

type DashboardTopbarProps = {
  activeSection: DashboardSection
  onSectionChange: (section: DashboardSection) => void
}

export default function DashboardTopbar({ activeSection, onSectionChange }: DashboardTopbarProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 px-4 py-4 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/88 sm:px-6 lg:px-8">
      <nav className="flex items-center justify-between gap-4" aria-label="Barra superior">
        <button className="grid h-11 w-11 place-items-center rounded-lg border border-slate-200 text-slate-700 dark:border-slate-800 dark:text-slate-200 lg:hidden" aria-label="Abrir menu">
          <Menu className="h-5 w-5" />
        </button>

        <label className="hidden min-h-11 flex-1 max-w-xl items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 md:flex">
          <Search className="h-4 w-4" aria-hidden="true" />
          <input
            className="h-10 flex-1 bg-transparent text-slate-900 outline-none placeholder:text-slate-500 dark:text-white"
            placeholder="Buscar aulas, turmas ou materiais"
            type="search"
          />
        </label>

        <section className="ml-auto flex items-center gap-2">
          <button className="grid h-11 w-11 place-items-center rounded-lg border border-slate-200 text-slate-700 transition hover:bg-slate-100 dark:border-slate-800 dark:text-slate-200 dark:hover:bg-slate-800" aria-label="Alternar modo escuro">
            <Moon className="h-5 w-5" />
          </button>
          <button className="relative grid h-11 w-11 place-items-center rounded-lg border border-slate-200 text-slate-700 transition hover:bg-slate-100 dark:border-slate-800 dark:text-slate-200 dark:hover:bg-slate-800" aria-label="Notificações">
            <Bell className="h-5 w-5" />
            <span className="absolute right-2.5 top-2.5 h-2.5 w-2.5 rounded-full bg-blue-700 ring-2 ring-white dark:ring-slate-950" />
          </button>
          <span className="hidden text-right sm:block">
            <span className="block text-sm font-bold">Professor João</span>
            <span className="block text-xs text-slate-500 dark:text-slate-400">Matemática</span>
          </span>
          <span className="grid h-11 w-11 place-items-center rounded-lg bg-blue-700 text-sm font-bold text-white">
            PJ
          </span>
        </section>
      </nav>

      <section className="mt-4 flex gap-2 overflow-x-auto pb-1 lg:hidden" aria-label="Navegação do dashboard">
        {menuItems.map((item) => (
          <button
            key={item.label}
            onClick={() => onSectionChange(item.label as DashboardSection)}
            className={`h-10 flex-none rounded-lg px-3 text-sm font-bold ${
              activeSection === item.label
                ? 'bg-blue-700 text-white'
                : 'border border-slate-200 text-slate-700 dark:border-slate-800 dark:text-slate-200'
            }`}
          >
            {item.label}
          </button>
        ))}
      </section>
    </header>
  )
}
