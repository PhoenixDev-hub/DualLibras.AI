import { PageTitle } from '../../../components/ui'
import { useTeacher } from '../../../contexts/TeacherContext'
export default function Settings() {
  const { user, logout } = useTeacher()
  return (
    <>
      <PageTitle title="Minha conta" description="Dados do seu cadastro." />
      <section className="t-card max-w-2xl space-y-5 p-7">
        <p>
          <strong>Nome:</strong> {user?.name}
        </p>
        <p>
          <strong>E-mail:</strong> {user?.email}
        </p>
        <p>
          <strong>Perfil:</strong> {user?.access.roleLabel}
        </p>
        <p>
          <strong>Instituição:</strong> {user?.institution || 'Não informada'}
        </p>
        <p>
          <strong>Disciplina:</strong> {user?.discipline || 'Não informada'}
        </p>
        <button className="t-btn" onClick={() => void logout()}>
          Sair da conta
        </button>
      </section>
    </>
  )
}
