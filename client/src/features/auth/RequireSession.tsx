import { useEffect, useState, type ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { authApi, ApiError } from '../../services/authApi'

export default function RequireSession({ children }: { children: ReactNode }) {
  const [state, setState] = useState<'loading' | 'ready' | 'login' | 'student' | 'error'>('loading')
  useEffect(() => {
    let current = true
    authApi.me().then(user => {
      if (current) setState(user.role === 'ALUNO' ? 'student' : 'ready')
    }).catch(error => {
      if (current) setState(error instanceof ApiError && error.status === 401 ? 'login' : 'error')
    })
    return () => { current = false }
  }, [])
  if (state === 'login') return <Navigate to="/entrar" replace />
  if (state === 'student') return <Navigate to="/dashboard" replace />
  if (state === 'error') return <p role="alert">Não foi possível verificar sua sessão. Atualize a página para tentar novamente.</p>
  if (state === 'loading') return <p role="status">Verificando sessão…</p>
  return children
}
