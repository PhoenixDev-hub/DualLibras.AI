import { CheckCircle2, Plus } from 'lucide-react'
import { getIcon, type DashboardSection } from './dashboardData'
import type { DashboardData } from '../../services/authApi'

type ManagementSectionProps = {
  section: Exclude<DashboardSection, 'Dashboard'>
  dashboard: DashboardData
}

export default function ManagementSection({ section, dashboard }: ManagementSectionProps) {
  const content = dashboard.managementSections[section]
  const Icon = getIcon(content.icon)
  const canUse = (capability?: string) => (
    capability ? dashboard.access.capabilities[capability] : true
  )

  return (
    <section>
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <article>
          <p className="mb-2 inline-flex items-center gap-2 rounded-lg bg-blue-100 px-3 py-1 text-sm font-bold text-blue-800 dark:bg-blue-950 dark:text-cyan-300">
            <Icon className="h-4 w-4" aria-hidden="true" />
            Área do professor
          </p>
          <h1 className="text-3xl font-black tracking-normal text-slate-950 dark:text-white sm:text-4xl">
            {content.title}
          </h1>
          <p className="mt-2 max-w-3xl text-base leading-7 text-slate-600 dark:text-slate-300">
            {content.description}
          </p>
        </article>
        {canUse(content.primaryCapability) && (
          <button className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-blue-700 px-5 text-sm font-bold text-white shadow-lg shadow-blue-700/20 transition hover:bg-blue-800">
            <Plus className="h-5 w-5" aria-hidden="true" />
            {content.primaryAction}
          </button>
        )}
      </header>

      <section className="mt-7 grid gap-5 xl:grid-cols-[1.4fr_0.6fr]">
        <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-xl font-black">Itens principais</h2>
          <ul className="mt-4 space-y-3">
            {content.rows.map((row) => (
              <li key={row.title} className="flex flex-col gap-3 rounded-lg border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950 sm:flex-row sm:items-center sm:justify-between">
                <span>
                  <span className="block text-base font-black text-slate-950 dark:text-white">{row.title}</span>
                  <span className="mt-1 block text-sm text-slate-600 dark:text-slate-300">{row.detail}</span>
                  <span className="mt-2 inline-flex items-center gap-2 rounded-lg bg-white px-2.5 py-1 text-xs font-bold text-blue-800 dark:bg-slate-900 dark:text-cyan-300">
                    <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                    {row.meta}
                  </span>
                </span>
                {canUse(row.capability) && (
                  <button className="inline-flex min-h-10 items-center justify-center rounded-lg bg-blue-700 px-4 text-sm font-bold text-white transition hover:bg-blue-800">
                    {row.action}
                  </button>
                )}
              </li>
            ))}
          </ul>
        </article>

        <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-xl font-black">{content.asideTitle}</h2>
          <ul className="mt-4 space-y-3">
            {content.asideItems.map((item) => (
              <li key={item} className="flex min-h-12 items-center gap-3 rounded-lg border border-slate-100 p-3 text-sm font-bold text-slate-800 dark:border-slate-800 dark:text-slate-100">
                <span className="h-2.5 w-2.5 rounded-full bg-blue-700 dark:bg-cyan-300" />
                {item}
              </li>
            ))}
          </ul>
        </article>
      </section>
    </section>
  )
}
