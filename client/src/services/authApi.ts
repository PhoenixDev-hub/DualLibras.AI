import { AUTH_API_BASE } from '../config/backend'

export type UserRole = 'PROFESSOR' | 'ALUNO' | 'SOCIEDADE' | 'ADMIN'
export type DashboardSection = 'Dashboard' | 'Minhas Turmas' | 'Aulas' | 'Materiais' | 'Glossários' | 'Histórico' | 'Configurações'

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

export type DashboardData = {
  access: DashboardAccess
  menuItems: Array<{ label: DashboardSection; icon: string }>
  stats: Array<{ label: string; value: string; detail: string; icon: string }>
  quickActions: Array<{ label: string; icon: string; capability?: string }>
  upcomingClasses: Array<{ className: string; group: string; time: string; status: string }>
  recentActivity: Array<{ label: string; detail: string; time: string }>
  weeklyClasses: number[]
  transcriptionTime: number[]
  managementSections: Record<Exclude<DashboardSection, 'Dashboard'>, {
    title: string
    description: string
    primaryAction: string
    primaryCapability?: string
    icon: string
    rows: Array<{ title: string; detail: string; meta: string; action: string; capability?: string }>
    asideTitle: string
    asideItems: string[]
  }>
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
    const data = await response.json().catch(() => null) as { error?: string } | null
    throw new Error(data?.error ?? 'Não foi possível completar a solicitação.')
  }

  if (response.status === 204) {
    return undefined as T
  }

  return response.json() as Promise<T>
}

export const authApi = {
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
}
