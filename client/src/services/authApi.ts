import { PendingRequests } from './pendingRequests'
import { DATA_CHANGED_EVENT } from '../hooks/useAutoRefresh'
import {
  emailError,
  nameError,
  normalizeEmail,
  normalizeName,
  passwordError,
  profileError,
} from '../validation/account'
import type {
  Classroom as Room,
  Student,
  Lesson,
  Material as Resource,
  Term,
} from '../types/education'
import { AUTH_API_BASE } from '../config/backend'

export type UserRole = 'PROFESSOR' | 'ALUNO' | 'ADMIN'
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

const pendingReads = new PendingRequests()
if (typeof window !== 'undefined') {
  window.addEventListener('storage', () => pendingReads.clear())
}

export function request<T>(path: string, init?: RequestInit): Promise<T> {
  // Requests with custom headers/signals retain their individual semantics.
  if (!init) return pendingReads.run(path, () => performRequest<T>(path))
  const mutation = !['GET', 'HEAD'].includes((init.method ?? 'GET').toUpperCase())
  if (mutation) pendingReads.clear()
  return performRequest<T>(path, init).finally(() => {
    if (mutation) pendingReads.clear()
  })
}

async function performRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${AUTH_API_BASE}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  })

  if (!response.ok) {
    if (response.status === 401) pendingReads.clear()
    const data = (await response.json().catch(() => null)) as {
      error?: string
      details?: Record<string, string[]>
    } | null
    const detail = data?.details ? Object.values(data.details).flat().join('. ') : ''
    throw new ApiError(
      detail || data?.error || 'Não foi possível completar a solicitação.',
      response.status,
    )
  }

  if (init?.method && !['GET', 'HEAD'].includes(init.method.toUpperCase())) {
    window.dispatchEvent(new Event(DATA_CHANGED_EVENT))
    try {
      localStorage.setItem(DATA_CHANGED_EVENT, `${Date.now()}-${Math.random()}`)
    } catch {
      // Local refresh still works when browser storage is unavailable.
    }
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
  publishTranscript(id: string | number, entry: { text: string; segmentId: string; capturedAt: string }) {
    return request<void>(`/education/lessons/${encodeURIComponent(id)}/transcript`, {
      method: 'POST',
      body: JSON.stringify(entry),
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
    const error = emailError(email) || passwordError(password, true)
    if (error) throw new ApiError(error, 400)
    email = normalizeEmail(email)
    return request<{ user: Omit<DashboardUser, 'access'> }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
  },

  register(data: {
    name: string
    email: string
    password: string
    role: 'PROFESSOR' | 'ALUNO'
    institution?: string
    discipline?: string
    registrationNumber?: string
  }) {
    const error =
      nameError(data.name) ||
      emailError(data.email) ||
      passwordError(data.password) ||
      profileError(data.institution ?? '', 'Instituição', 150) ||
      profileError(data.discipline ?? '', 'Disciplina', 100) ||
      profileError(data.registrationNumber ?? '', 'Matrícula', 50) ||
      (data.role === 'PROFESSOR' && !data.discipline?.trim()
        ? 'Disciplina é obrigatória para professores'
        : undefined) ||
      (data.role === 'ALUNO' && !data.registrationNumber?.trim()
        ? 'Matrícula é obrigatória para alunos'
        : undefined)
    if (error) throw new ApiError(error, 400)
    data = {
      ...data,
      name: normalizeName(data.name),
      email: normalizeEmail(data.email),
      institution: data.institution?.trim(),
      discipline: data.discipline?.trim(),
      registrationNumber: data.registrationNumber?.trim(),
    }
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

  materialUploadOptions() {
    return request<{ extensions: string[]; maxBytes: number }>('/materials/options')
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
