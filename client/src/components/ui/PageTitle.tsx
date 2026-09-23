import type { ReactNode } from 'react'

export function PageTitle({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <header className="mb-7 flex flex-wrap items-center justify-between gap-4">
      <section>
        {eyebrow && (
          <p className="mb-2 text-xs font-bold uppercase tracking-[.18em] text-primary dark:text-blue-300">
            {eyebrow}
          </p>
        )}
        <h1 className="font-ui text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
        {description && (
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{description}</p>
        )}
      </section>
      {action}
    </header>
  )
}
