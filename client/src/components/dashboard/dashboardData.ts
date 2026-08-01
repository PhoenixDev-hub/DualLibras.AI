import {
  Clock3,
  Download,
  FilePlus2,
  FileText,
  GraduationCap,
  History,
  LayoutDashboard,
  LibraryBig,
  Settings,
  SlidersHorizontal,
  Upload,
  UserPlus,
  Video,
  type LucideIcon,
} from 'lucide-react'
import type { DashboardSection } from '../../services/authApi'

export type { DashboardSection }

export const iconMap: Record<string, LucideIcon> = {
  Clock3,
  Download,
  FilePlus2,
  FileText,
  GraduationCap,
  History,
  LayoutDashboard,
  LibraryBig,
  Settings,
  SlidersHorizontal,
  Upload,
  UserPlus,
  Video,
}

export function getIcon(name: string) {
  return iconMap[name] ?? LayoutDashboard
}

export function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}
