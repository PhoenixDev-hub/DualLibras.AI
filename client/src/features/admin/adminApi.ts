import { request, type UserRole } from '../../services/authApi'
export type AdminUser = {
  id: string
  name: string
  email: string
  role: UserRole
  isActive: boolean
  schoolId: string | null
  createdAt: string
  school: { id: string; name: string } | null
  teacherProfile: { discipline: string | null } | null
  studentProfile: { registrationNumber: string | null } | null
  _count: { memberships: number; classroomsOwned: number }
}
export type AdminSchool = {
  id: string
  name: string
  city: string | null
  state: string | null
  _count: { users: number; classrooms: number }
}
export type AdminClassroom = {
  id: string
  name: string
  description: string | null
  code: string
  schoolId: string | null
  teacherId: string
  teacher: { id: string; name: string }
  school: { id: string; name: string } | null
  _count: { members: number; lessons: number; materials: number }
}
export type LessonStatus = 'AGENDADA' | 'EM_ANDAMENTO' | 'FINALIZADA' | 'CANCELADA'
export type AdminLesson = {
  id: string
  title: string
  status: LessonStatus
  createdAt: string
  teacher: { name: string }
  classroom: { name: string }
  _count: { materials: number }
}
export type AdminMaterial = {
  id: string
  name: string
  type: string
  createdAt: string
  classroom: { name: string } | null
  lesson: { title: string; classroom: { name: string } } | null
  uploadedBy: { name: string }
}
export type AdminMember = {
  userId: string
  joinedAt: string
  user: { name: string; email: string; role: UserRole; isActive: boolean }
}
export type AdminOverview = {
  schools: number
  users: number
  activeUsers: number
  blockedUsers: number
  teachers: number
  students: number
  admins: number
  classrooms: number
  lessons: number
  liveLessons: number
  materials: number
}
export type AdminOptions = {
  classrooms: { id: string; name: string }[]
  schools: { id: string; name: string }[]
  teachers: { id: string; name: string; schoolId: string | null }[]
}
export type AdminEntities = {
  users: AdminUser
  schools: AdminSchool
  classrooms: AdminClassroom
  lessons: AdminLesson
  materials: AdminMaterial
}
export type Resource = keyof AdminEntities
export type Page<T> = { items: T[]; total: number; page: number; pageSize: number }
export const roleLabels: Record<UserRole, string> = {
  ADMIN: 'Administrador',
  PROFESSOR: 'Professor',
  ALUNO: 'Aluno',
}
export const lessonLabels: Record<LessonStatus, string> = {
  AGENDADA: 'Agendada',
  EM_ANDAMENTO: 'Em andamento',
  FINALIZADA: 'Finalizada',
  CANCELADA: 'Cancelada',
}
const encoded = encodeURIComponent
export const adminApi = {
  lessonDetail: (id: string) =>
    request<{
      id: string
      title: string
      status: LessonStatus
      classroom: { name: string }
      teacher: { name: string }
      summary: { content: string } | null
      transcriptionSessions: { transcript: string | null }[]
    }>(`/admin/lessons/${encoded(id)}`),
  overview: () => request<AdminOverview>('/admin/overview'),
  options: () => request<AdminOptions>('/admin/options'),
  list: <R extends Resource>(resource: R, filters: Record<string, string | number> = {}) =>
    request<Page<AdminEntities[R]>>(
      `/admin/${resource}?${new URLSearchParams(
        Object.entries(filters)
          .filter(([, value]) => value !== '')
          .map(([key, value]) => [key, String(value)]),
      )}`,
    ),
  save: (resource: Resource, id: string | undefined, data: unknown) =>
    request(`/admin/${resource}${id ? `/${encoded(id)}` : ''}`, {
      method: id ? 'PATCH' : 'POST',
      body: JSON.stringify(data),
    }),
  remove: (resource: Resource, id: string) =>
    request<void>(`/admin/${resource}/${encoded(id)}`, { method: 'DELETE' }),
  status: (id: string, isActive: boolean) =>
    request(`/admin/users/${encoded(id)}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive }),
    }),
  password: (id: string, password: string) =>
    request<void>(`/admin/users/${encoded(id)}/password`, {
      method: 'PATCH',
      body: JSON.stringify({ password }),
    }),
  members: (id: string) => request<AdminMember[]>(`/admin/classrooms/${encoded(id)}/members`),
  addMember: (id: string, userId: string) =>
    request(`/admin/classrooms/${encoded(id)}/members`, {
      method: 'POST',
      body: JSON.stringify({ userId }),
    }),
  removeMember: (id: string, userId: string) =>
    request<void>(`/admin/classrooms/${encoded(id)}/members/${encoded(userId)}`, {
      method: 'DELETE',
    }),
}
