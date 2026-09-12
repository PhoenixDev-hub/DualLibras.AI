import type { LucideIcon } from 'lucide-react'
import type { ButtonHTMLAttributes } from 'react'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & { icon: LucideIcon }

export default function RoomNavButton({ icon: Icon, children, className = '', ...props }: Props) {
  return (
    <button
      type="button"
      className={`inline-flex min-h-12 items-center justify-center gap-3 rounded-lg px-4 py-2 text-sm font-semibold lg:px-6 lg:text-base transition-colors hover:bg-primary/20 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-text-light ${className}`}
      {...props}
    >
      <Icon size={19} aria-hidden="true" />
      {children}
    </button>
  )
}
