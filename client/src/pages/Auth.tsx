import Cadastro from '../features/auth/components/Cadastro';
import Login from '../features/auth/components/Login';

interface AuthProps {
  mode: 'login' | 'cadastro';
}

export default function Auth({ mode }: AuthProps) {
  return mode === 'login' ? <Login /> : <Cadastro />;
}
