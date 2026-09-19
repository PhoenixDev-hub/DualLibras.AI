import {
  BookOpen,
  GraduationCap,
  Hand,
  Home,
  LayoutGrid,
  Settings,
  Users,
  Video,
} from 'lucide-react'
import type { ComponentProps } from 'react'
import { useTeacher } from '../../contexts/TeacherContext'
import DashboardShell from './DashboardShell'
const navigation = [
  { label: 'Início', icon: Home },
  { label: 'Minhas turmas', icon: LayoutGrid },
  { label: 'Minhas aulas', icon: Video },
  { label: 'Meus alunos', icon: Users },
  { label: 'Materiais', icon: BookOpen },
  { label: 'Glossário', icon: GraduationCap },
  { label: 'Aprender Libras', icon: Hand },
  { label: 'Configurações', icon: Settings },
]

type TeacherShellProps = Omit<
  ComponentProps<typeof DashboardShell>,
  'user' | 'logout' | 'navigation' | 'student' | 'onProfile'
>
export default function TeacherShell(props: TeacherShellProps) {
  const { user, logout } = useTeacher()
  return (
    <DashboardShell
      {...props}
      user={user}
      logout={logout}
      navigation={navigation}
      onProfile={() => props.onNavigate('Configurações')}
    />
  )
}
