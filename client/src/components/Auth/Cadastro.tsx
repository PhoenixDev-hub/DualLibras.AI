import { ArrowRight, BookOpen, Building2, Eye, EyeOff, Hash, Lock, Mail, User, Users } from 'lucide-react';
import { type FormEvent, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import heroBg from '../../assets/hero-bg.png';
import { authApi } from '../../services/authApi';

type Role = 'PROFESSOR' | 'ALUNO' | 'SOCIEDADE';

const roleOptions: Array<{ value: Role; label: string }> = [
  { value: 'ALUNO', label: 'Aluno' },
  { value: 'PROFESSOR', label: 'Professor' },
  { value: 'SOCIEDADE', label: 'Sociedade' },
];

export default function Cadastro() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Role>('ALUNO');
  const [institution, setInstitution] = useState('');
  const [discipline, setDiscipline] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const roleSpecificField = useMemo(() => {
    if (role === 'PROFESSOR') {
      return {
        id: 'discipline',
        label: 'Disciplina',
        placeholder: 'Ex.: Matemática',
        value: discipline,
        setValue: setDiscipline,
        icon: BookOpen,
      };
    }

    if (role === 'ALUNO') {
      return {
        id: 'registrationNumber',
        label: 'Matrícula',
        placeholder: 'Número de matrícula',
        value: registrationNumber,
        setValue: setRegistrationNumber,
        icon: Hash,
      };
    }

    return null;
  }, [discipline, registrationNumber, role]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('As senhas informadas não conferem.');
      return;
    }

    if (!acceptedTerms) {
      setError('Aceite os termos de uso e a política de privacidade para continuar.');
      return;
    }

    setIsSubmitting(true);

    try {
      await authApi.register({
        name,
        email,
        password,
        role,
        institution: role === 'SOCIEDADE' ? undefined : institution || undefined,
        discipline: role === 'PROFESSOR' ? discipline : undefined,
        registrationNumber: role === 'ALUNO' ? registrationNumber : undefined,
      });
      navigate('/app');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível criar a conta.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen flex bg-background-dark">
      <section className="hidden lg:flex relative w-1/2 items-center justify-center overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center scale-110 blur-sm"
          style={{ backgroundImage: `url(${heroBg})` }}
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-primary/50 mix-blend-multiply" aria-hidden="true" />
        <div
          className="absolute inset-0 bg-gradient-to-br from-background-dark/90 via-background-dark/40 to-background-dark/95"
          aria-hidden="true"
        />

        <div className="relative z-10 max-w-md px-10 text-center">
          <Link to="/" className="text-3xl font-logo font-bold text-primary tracking-tight">
            DualLibras.ai
          </Link>
          <h2 className="mt-6 font-ui font-extrabold text-text-light text-3xl leading-tight">
            Comece a incluir <span className="text-primary">todos os alunos hoje.</span>
          </h2>
          <p className="mt-4 text-gray-mid font-text leading-relaxed">
            Crie sua conta gratuita e leve tradução em tempo real para a sua sala de aula.
          </p>
        </div>
      </section>

      <section className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <Link
            to="/"
            className="lg:hidden inline-block mb-8 text-2xl font-logo font-bold text-primary tracking-tight"
          >
            DualLibras.ai
          </Link>

          <span className="inline-flex items-center px-4 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary font-logo text-xs uppercase tracking-[0.2em]">
            Cadastro gratuito
          </span>

          <h1 className="mt-5 font-ui font-extrabold text-text-light text-3xl">Criar conta</h1>
          <p className="mt-2 text-sm text-gray-mid font-text">
            Já tem uma conta?{' '}
            <Link to="/entrar" className="text-primary hover:text-primary/80 font-medium">
              Entrar
            </Link>
          </p>

          <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="name" className="block text-sm font-ui font-medium text-text-light mb-2">
                Nome completo
              </label>
              <div className="relative">
                <User size={18} strokeWidth={1.75} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-mid" aria-hidden="true" />
                <input
                  id="name"
                  type="text"
                  autoComplete="name"
                  placeholder="Seu nome"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  required
                  minLength={2}
                  className="w-full pl-11 pr-4 py-3 rounded-lg border border-primary/20 bg-secondary/10 text-text-light placeholder:text-gray-mid/60 font-text text-sm focus:outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/30 transition-colors"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-ui font-medium text-text-light mb-2">
                E-mail
              </label>
              <div className="relative">
                <Mail size={18} strokeWidth={1.75} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-mid" aria-hidden="true" />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="voce@escola.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  className="w-full pl-11 pr-4 py-3 rounded-lg border border-primary/20 bg-secondary/10 text-text-light placeholder:text-gray-mid/60 font-text text-sm focus:outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/30 transition-colors"
                />
              </div>
            </div>

            <div>
              <label htmlFor="role" className="block text-sm font-ui font-medium text-text-light mb-2">
                Tipo de usuário
              </label>
              <div className="relative">
                <Users size={18} strokeWidth={1.75} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-mid" aria-hidden="true" />
                <select
                  id="role"
                  value={role}
                  onChange={(event) => setRole(event.target.value as Role)}
                  className="w-full appearance-none pl-11 pr-4 py-3 rounded-lg border border-primary/20 bg-background-dark text-text-light font-text text-sm focus:outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/30 transition-colors"
                >
                  {roleOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {role !== 'SOCIEDADE' && (
              <div>
                <label htmlFor="institution" className="block text-sm font-ui font-medium text-text-light mb-2">
                  Instituição
                </label>
                <div className="relative">
                  <Building2 size={18} strokeWidth={1.75} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-mid" aria-hidden="true" />
                  <input
                    id="institution"
                    type="text"
                    autoComplete="organization"
                    placeholder="Nome da escola ou instituição"
                    value={institution}
                    onChange={(event) => setInstitution(event.target.value)}
                    className="w-full pl-11 pr-4 py-3 rounded-lg border border-primary/20 bg-secondary/10 text-text-light placeholder:text-gray-mid/60 font-text text-sm focus:outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/30 transition-colors"
                  />
                </div>
              </div>
            )}

            {roleSpecificField && (
              <div>
                <label htmlFor={roleSpecificField.id} className="block text-sm font-ui font-medium text-text-light mb-2">
                  {roleSpecificField.label}
                </label>
                <div className="relative">
                  <roleSpecificField.icon size={18} strokeWidth={1.75} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-mid" aria-hidden="true" />
                  <input
                    id={roleSpecificField.id}
                    type="text"
                    placeholder={roleSpecificField.placeholder}
                    value={roleSpecificField.value}
                    onChange={(event) => roleSpecificField.setValue(event.target.value)}
                    required
                    className="w-full pl-11 pr-4 py-3 rounded-lg border border-primary/20 bg-secondary/10 text-text-light placeholder:text-gray-mid/60 font-text text-sm focus:outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/30 transition-colors"
                  />
                </div>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="password" className="block text-sm font-ui font-medium text-text-light mb-2">
                  Senha
                </label>
                <div className="relative">
                  <Lock size={18} strokeWidth={1.75} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-mid" aria-hidden="true" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="Mínimo 8 caracteres"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                    minLength={8}
                    className="w-full pl-11 pr-11 py-3 rounded-lg border border-primary/20 bg-secondary/10 text-text-light placeholder:text-gray-mid/60 font-text text-sm focus:outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/30 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-mid hover:text-primary transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} strokeWidth={1.75} aria-hidden="true" /> : <Eye size={18} strokeWidth={1.75} aria-hidden="true" />}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="confirm-password" className="block text-sm font-ui font-medium text-text-light mb-2">
                  Confirmar senha
                </label>
                <div className="relative">
                  <Lock size={18} strokeWidth={1.75} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-mid" aria-hidden="true" />
                  <input
                    id="confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="Repita a senha"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    required
                    minLength={8}
                    className="w-full pl-11 pr-11 py-3 rounded-lg border border-primary/20 bg-secondary/10 text-text-light placeholder:text-gray-mid/60 font-text text-sm focus:outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/30 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((v) => !v)}
                    aria-label={showConfirmPassword ? 'Ocultar senha' : 'Mostrar senha'}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-mid hover:text-primary transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff size={18} strokeWidth={1.75} aria-hidden="true" /> : <Eye size={18} strokeWidth={1.75} aria-hidden="true" />}
                  </button>
                </div>
              </div>
            </div>

            <label className="flex items-start gap-2.5 text-xs text-gray-mid font-text">
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={(event) => setAcceptedTerms(event.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-primary/30 bg-secondary/10 text-primary focus:ring-primary/40"
              />
              <span>
                Concordo com os{' '}
                <Link to="/termos" className="text-primary hover:text-primary/80">
                  Termos de uso
                </Link>{' '}
                e a{' '}
                <Link to="/privacidade" className="text-primary hover:text-primary/80">
                  Política de privacidade
                </Link>
              </span>
            </label>

            {error && (
              <p className="rounded-lg border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-100" role="alert">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-primary to-secondary text-text-light font-ui font-semibold tracking-wide rounded-full shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:brightness-110 hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:scale-100 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background-dark"
            >
              {isSubmitting ? 'Criando conta...' : 'Criar conta'}
              <ArrowRight size={18} strokeWidth={2} aria-hidden="true" />
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
