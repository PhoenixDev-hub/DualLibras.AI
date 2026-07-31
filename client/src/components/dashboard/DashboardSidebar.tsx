import { LogOut } from 'lucide-react'
import { Link } from 'react-router-dom'
import logoTipo from '../../assets/Logotipo.png'
import { type DashboardSection, menuItems } from './dashboardData'

type DashboardSidebarProps = {
  activeSection: DashboardSection
  onSectionChange: (section: DashboardSection) => void
}

export default function DashboardSidebar({ activeSection, onSectionChange }: DashboardSidebarProps) {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 border-r border-slate-200 bg-white px-5 py-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:flex lg:flex-col">
      <Link to="/" className="flex items-center" aria-label="DualLibras.AI">
        <img src={logoTipo} alt="DualLibras.AI" className="h-10 w-auto max-w-52 object-contain" />
      </Link>

      <nav className="mt-9 flex flex-1 flex-col gap-1" aria-label="Navegação principal">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = activeSection === item.label

          return (
            <button
              key={item.label}
              onClick={() => onSectionChange(item.label as DashboardSection)}
              className={`flex min-h-12 w-full items-center gap-3 rounded-lg px-3 text-left text-sm font-semibold transition ${
                isActive
                  ? 'bg-blue-700 text-white shadow-sm shadow-blue-700/20'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950 focus-visible:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white dark:focus-visible:bg-slate-800'
              }`}
            >
              <Icon className="h-5 w-5" aria-hidden="true" />
              {item.label}
            </button>
          )
        })}
      </nav>

      <section className="border-t border-slate-200 pt-5 dark:border-slate-800">
        <button className="flex w-full items-center gap-3 rounded-lg p-2 text-left transition hover:bg-slate-100 dark:hover:bg-slate-800">
          <span className="grid h-11 w-11 place-items-center rounded-lg bg-blue-100 text-sm font-bold text-blue-800 dark:bg-blue-950 dark:text-cyan-300">
            PJ
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-bold">Professor João</span>
            <span className="block truncate text-xs text-slate-500 dark:text-slate-400">Matemática</span>
          </span>
        </button>
        <button className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-slate-200 text-sm font-bold text-slate-700 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700 dark:border-slate-800 dark:text-slate-300 dark:hover:border-red-900 dark:hover:bg-red-950/40 dark:hover:text-red-300">
          <LogOut className="h-4 w-4" aria-hidden="true" />
          Sair
        </button>
      </section>
    </aside>
  )
}
