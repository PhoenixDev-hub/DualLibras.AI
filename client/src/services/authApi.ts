import type {
  Classroom as Room,
  Student,
  Lesson,
  Material as Resource,
  Term,
} from '../types/education'
import { AUTH_API_BASE } from '../config/backend'

export type UserRole = 'PROFESSOR' | 'ALUNO' | 'SOCIEDADE' | 'ADMIN'
export type DashboardSection =
  | 'Dashboard'
  | 'Minhas Turmas'
  | 'Aulas'
  | 'Materiais'
  | 'Glossários'
  | 'Histórico'
  | 'Configurações'

export type DashboardUser = {
  id: string
  name: string
  email: string
  role: UserRole
  discipline?: string
  institution?: string
  registrationNumber?: string
  access: DashboardAccess
}

export type DashboardAccess = {
  roleLabel: string
  sections: DashboardSection[]
  capabilities: Record<string, boolean>
}

export type Classroom = {
  id: string
  name: string
  code: string
  studentsCount: number
  lessonsCount: number
  createdAt: string
}

export type Material = {
  id: string
  name: string
  url: string
  type: string
  displayType: string
  createdAt: string
}

export type DashboardData = {
  access: DashboardAccess
  menuItems: Array<{ label: DashboardSection; icon: string }>
  stats: Array<{ label: string; value: string; detail: string; icon: string }>
  quickActions: Array<{ label: string; icon: string; capability?: string }>
  upcomingClasses: Array<{ className: string; group: string; time: string; status: string }>
  recentActivity: Array<{ label: string; detail: string; time: string }>
  weeklyClasses: number[]
  transcriptionTime: number[]
  managementSections: Record<
    Exclude<DashboardSection, 'Dashboard'>,
    {
      title: string
      description: string
      primaryAction: string
      primaryCapability?: string
      icon: string
      rows: Array<{
        title: string
        detail: string
        meta: string
        action: string
        capability?: string
      }>
      asideTitle: string
      asideItems: string[]
    }
  >
}

export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}
export type EducationData = {
  classrooms: Room[]
  students: Student[]
  lessons: Lesson[]
  materials: Resource[]
  terms: Term[]
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${AUTH_API_BASE}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  })

  if (!response.ok) {
    const data = (await response.json().catch(() => null)) as { error?: string } | null
    throw new ApiError(data?.error ?? 'Não foi possível completar a solicitação.', response.status)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return response.json() as Promise<T>
}

export const authApi = {
  createLesson(title: string, classroomId: string) {
    return request<Lesson>('/education/lessons', {
      method: 'POST',
      body: JSON.stringify({ title, classroomId }),
    })
  },
  publishTranscript(id: string | number, text: string) {
    return request<void>(`/education/lessons/${encodeURIComponent(id)}/transcript`, {
      method: 'POST',
      body: JSON.stringify({ text }),
    })
  },
  finishLesson(id: string | number) {
    return request<void>(`/education/lessons/${encodeURIComponent(id)}/finish`, { method: 'POST' })
  },
  education() {
    return request<EducationData>('/education')
  },
  updateClassroom(id: string | number, data: { name: string; description: string }) {
    return request<void>(`/education/classrooms/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  },
  joinClassroom(code: string) {
    return request<{ classroomId: string }>('/education/join', {
      method: 'POST',
      body: JSON.stringify({ code }),
    })
  },
  removeMember(id: string | number, userId: string | number) {
    return request<void>(
      `/education/classrooms/${encodeURIComponent(id)}/members/${encodeURIComponent(userId)}`,
      { method: 'DELETE' },
    )
  },
  login(email: string, password: string) {
    return request<{ user: Omit<DashboardUser, 'access'> }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
  },

  register(data: {
    name: string
    email: string
    password: string
    role: 'PROFESSOR' | 'ALUNO' | 'SOCIEDADE'
    institution?: string
    discipline?: string
    registrationNumber?: string
  }) {
    return request<{ user: Omit<DashboardUser, 'access'> }>('/auth/cadastro', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  me() {
    return request<DashboardUser>('/users/me')
  },

  dashboard() {
    return request<DashboardData>('/dashboard')
  },

  logout() {
    return request<void>('/auth/logout', { method: 'POST' })
  },

  classrooms() {
    return request<{ classrooms: Classroom[] }>('/classrooms')
  },

  createClassroom(name: string, description = '') {
    return request<{ classroom: Classroom }>('/classrooms', {
      method: 'POST',
      body: JSON.stringify({ name, description }),
    })
  },

  materials() {
    return request<{ materials: Material[] }>('/materials')
  },

  uploadMaterial(data: {
    filename: string
    contentBase64: string
    lessonId?: string
    classroomId?: string
  }) {
    return request<{ material: Material; ai: { sent: boolean; status: 'enviado' | 'pendente' } }>(
      '/materials',
      {
        method: 'POST',
        body: JSON.stringify(data),
      },
    )
  },
}
