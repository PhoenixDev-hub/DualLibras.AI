type BarChartProps = {
  values: number[]
  label: string
}

export default function BarChart({ values, label }: BarChartProps) {
  const max = Math.max(...values)

  return (
    <figure className="m-0" aria-label={label}>
      <section className="flex h-36 items-end gap-2 rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950">
        {values.map((value, index) => (
          <span
            key={`${label}-${index}`}
            className="flex flex-1 items-end rounded-md bg-blue-100 dark:bg-blue-950"
            aria-label={`${value}`}
          >
            <span
              className="w-full rounded-md bg-blue-700 transition-all dark:bg-cyan-400"
              style={{ height: `${Math.max(18, (value / max) * 100)}%` }}
            />
          </span>
        ))}
      </section>
    </figure>
  )
}
