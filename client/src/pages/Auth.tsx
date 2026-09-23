import ThemeToggle from '../features/theme/ThemeToggle'
import Cadastro from '../features/auth/pages/Cadastro'
import Login from '../features/auth/pages/Login'

interface AuthProps {
  mode: 'login' | 'cadastro'
}

export default function Auth({ mode }: AuthProps) {
  return (
    <>
      <ThemeToggle className="theme-toggle-auth" />
      {mode === 'login' ? <Login /> : <Cadastro />}
    </>
  )
}
