export function Tabs({
  items,
  value,
  onChange,
}: {
  items: string[]
  value: string
  onChange: (value: string) => void
}) {
  return (
    <nav
      aria-label="Seções da página"
      className="mb-6 flex gap-6 overflow-x-auto border-b border-slate-200 dark:border-slate-700"
    >
      {items.map((item) => (
        <button
          key={item}
          aria-current={value === item ? 'page' : undefined}
          onClick={() => onChange(item)}
          className={`whitespace-nowrap border-b-2 px-1 py-4 text-sm font-semibold ${value === item ? 'border-primary text-primary dark:text-blue-300' : 'border-transparent text-slate-500 dark:text-slate-400'}`}
        >
          {item}
        </button>
      ))}
    </nav>
  )
}
