import { Inbox } from 'lucide-react'

export function Empty({ text }: { text: string }) {
  return (
    <section className="t-card flex flex-col items-center gap-3 p-10 text-center text-slate-500 dark:text-slate-400">
      <Inbox size={32} />
      <p>{text}</p>
    </section>
  )
}
