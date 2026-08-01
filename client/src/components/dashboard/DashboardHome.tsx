import { ChevronRight, MessageSquareText, Plus, Sparkles, Square, Video } from 'lucide-react'
import { Link } from 'react-router-dom'
import BarChart from './BarChart'
import { getIcon } from './dashboardData'
import type { DashboardData, DashboardUser } from '../../services/authApi'

type DashboardHomeProps = {
  user: DashboardUser
  dashboard: DashboardData
  onCreateClassroom: () => void
  onUploadMaterial: () => void
}

export default function DashboardHome({ user, dashboard, onCreateClassroom, onUploadMaterial }: DashboardHomeProps) {
  const profileLabel = user.discipline ?? user.institution ?? user.access.roleLabel
  const canStartTranscription = dashboard.access.capabilities.startTranscription
  const quickActions = dashboard.quickActions.filter((action) => (
    action.capability ? dashboard.access.capabilities[action.capability] : true
  ))

  return (
    <>
      <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <article>
          <p className="mb-2 inline-flex items-center gap-2 rounded-lg bg-blue-100 px-3 py-1 text-sm font-bold text-blue-800 dark:bg-blue-950 dark:text-cyan-300">
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            {profileLabel}
          </p>
          <h1 className="text-3xl font-black tracking-normal text-slate-950 dark:text-white sm:text-4xl">
            Olá, {user.name}
          </h1>
          <p className="mt-2 max-w-2xl text-base leading-7 text-slate-600 dark:text-slate-300">
            Tenha uma visão geral das suas aulas, turmas e recursos de acessibilidade com IA.
          </p>
        </article>
        {canStartTranscription && (
          <Link
            to="/aula"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-blue-700 px-5 text-sm font-bold text-white shadow-lg shadow-blue-700/20 transition hover:bg-blue-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
          >
            <Video className="h-5 w-5" aria-hidden="true" />
            Iniciar aula
          </Link>
        )}
      </section>

      <section className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Estatísticas principais">
        {dashboard.stats.map((stat) => {
          const Icon = getIcon(stat.icon)
          return (
            <article key={stat.label} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <span className="grid h-11 w-11 place-items-center rounded-lg bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-cyan-300">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <p className="mt-4 text-sm font-semibold text-slate-600 dark:text-slate-300">{stat.label}</p>
              <strong className="mt-1 block text-3xl font-black text-slate-950 dark:text-white">{stat.value}</strong>
              <span className="mt-2 block text-sm font-semibold text-emerald-700 dark:text-emerald-300">{stat.detail}</span>
            </article>
          )
        })}
      </section>

      <section className="mt-7 grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <article className="rounded-lg border border-blue-200 bg-blue-700 p-6 text-white shadow-lg shadow-blue-700/15 dark:border-blue-800 dark:bg-blue-900">
          <span className="inline-flex items-center gap-2 rounded-lg bg-white/12 px-3 py-1 text-sm font-bold">
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            Começar agora
          </span>
          <h2 className="mt-5 text-2xl font-black">Iniciar nova aula</h2>
          <p className="mt-2 max-w-xl text-base leading-7 text-blue-50">
            Comece uma nova transcrição e tradução em Libras.
          </p>
          {canStartTranscription && (
            <Link
              to="/aula"
              className="mt-6 inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-white px-5 text-sm font-black text-blue-800 transition hover:bg-blue-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              <Video className="h-5 w-5" aria-hidden="true" />
              Iniciar aula
            </Link>
          )}
        </article>

        <section className="grid gap-3 sm:grid-cols-2">
          {quickActions.map((action) => {
            const Icon = getIcon(action.icon)
            const isCreateClassroomAction = action.capability === 'createClass'
            const isUploadMaterialAction = action.capability === 'uploadMaterial'

            return (
              <button
                key={action.label}
                onClick={isCreateClassroomAction ? onCreateClassroom : isUploadMaterialAction ? onUploadMaterial : undefined}
                className="flex min-h-20 items-center justify-between rounded-lg border border-slate-200 bg-white p-4 text-left font-bold text-slate-900 shadow-sm transition hover:border-blue-300 hover:bg-blue-50 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:hover:border-blue-700 dark:hover:bg-blue-950/40"
              >
                <span className="flex items-center gap-3">
                  <span className="grid h-11 w-11 place-items-center rounded-lg bg-slate-100 text-blue-800 dark:bg-slate-800 dark:text-cyan-300">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  {action.label}
                </span>
                <Plus className="h-5 w-5 text-blue-700 dark:text-cyan-300" aria-hidden="true" />
              </button>
            )
          })}
        </section>
      </section>

      <section className="mt-7 grid gap-5 xl:grid-cols-[1.35fr_0.65fr]">
        <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <header className="flex items-center justify-between gap-4">
            <h2 className="text-xl font-black">Próximas aulas</h2>
            <button className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 px-3 text-sm font-bold text-slate-700 transition hover:bg-slate-100 dark:border-slate-800 dark:text-slate-200 dark:hover:bg-slate-800">
              Ver agenda
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </header>
          <section className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[620px] border-separate border-spacing-y-2 text-left">
              <thead>
                <tr className="text-sm text-slate-500 dark:text-slate-400">
                  <th className="px-3 py-2 font-bold">Nome da aula</th>
                  <th className="px-3 py-2 font-bold">Turma</th>
                  <th className="px-3 py-2 font-bold">Horário</th>
                  <th className="px-3 py-2 font-bold">Status</th>
                  <th className="px-3 py-2 font-bold">Ação</th>
                </tr>
              </thead>
              <tbody>
                {dashboard.upcomingClasses.map((item) => (
                  <tr key={`${item.className}-${item.group}`} className="bg-slate-50 text-sm dark:bg-slate-950">
                    <td className="rounded-l-lg px-3 py-4 font-bold text-slate-950 dark:text-white">{item.className}</td>
                    <td className="px-3 py-4 text-slate-600 dark:text-slate-300">{item.group}</td>
                    <td className="px-3 py-4 font-bold">{item.time}</td>
                    <td className="px-3 py-4">
                      <span className="rounded-lg bg-emerald-100 px-2.5 py-1 text-xs font-black text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                        {item.status}
                      </span>
                    </td>
                    <td className="rounded-r-lg px-3 py-4">
                      <span className="flex gap-2">
                        {canStartTranscription && (
                          <Link to="/aula" className="inline-flex min-h-10 items-center justify-center rounded-lg bg-blue-700 px-4 text-sm font-bold text-white transition hover:bg-blue-800">
                            Iniciar
                          </Link>
                        )}
                        <button className="grid h-10 w-10 place-items-center rounded-lg border border-slate-200 text-slate-700 transition hover:bg-slate-100 dark:border-slate-800 dark:text-slate-200 dark:hover:bg-slate-800" aria-label="Encerrar transcrição">
                          <Square className="h-4 w-4" aria-hidden="true" />
                        </button>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </article>

        <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-xl font-black">Atividade recente</h2>
          <ul className="mt-4 space-y-3">
            {dashboard.recentActivity.map((activity) => (
              <li key={`${activity.label}-${activity.detail}`} className="flex gap-3 rounded-lg border border-slate-100 p-3 dark:border-slate-800">
                <span className="mt-1 grid h-9 w-9 flex-none place-items-center rounded-lg bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-cyan-300">
                  <MessageSquareText className="h-4 w-4" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-bold">{activity.label}</span>
                  <span className="block truncate text-sm text-slate-600 dark:text-slate-300">{activity.detail}</span>
                </span>
                <time className="text-xs font-semibold text-slate-500 dark:text-slate-400">{activity.time}</time>
              </li>
            ))}
          </ul>
        </article>
      </section>

      <section className="mt-7 grid gap-5 xl:grid-cols-2" aria-label="Estatísticas detalhadas">
        <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-lg font-black">Aulas realizadas por semana</h2>
          <p className="mb-4 mt-1 text-sm text-slate-600 dark:text-slate-300">Volume por dia nos últimos 7 dias.</p>
          <BarChart values={dashboard.weeklyClasses} label="Aulas realizadas por semana" />
        </article>

        <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-lg font-black">Tempo total de transcrição</h2>
          <p className="mb-4 mt-1 text-sm text-slate-600 dark:text-slate-300">Horas processadas e revisadas.</p>
          <BarChart values={dashboard.transcriptionTime} label="Tempo total de transcrição" />
        </article>
      </section>
    </>
  )
}
