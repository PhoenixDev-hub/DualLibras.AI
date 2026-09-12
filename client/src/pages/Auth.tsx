import Cadastro from '../features/auth/pages/Cadastro'
import Login from '../features/auth/pages/Login'

interface AuthProps {
  mode: 'login' | 'cadastro'
}

export default function Auth({ mode }: AuthProps) {
  return mode === 'login' ? <Login /> : <Cadastro />
}
