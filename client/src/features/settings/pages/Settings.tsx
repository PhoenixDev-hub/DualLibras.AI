import type { FormEvent } from 'react'
import { PageTitle } from '../../../components/ui'
import { teacher } from '../../../data/teacherDemo'
import { useTeacher } from '../../../contexts/TeacherContext'
export default function Settings() {
  const { notify } = useTeacher()
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    notify('Preferências salvas nesta demonstração visual.')
  }

  return (
    <>
      <PageTitle title="Configurações" description="Seu perfil e suas preferências de ensino." />
      <form className="t-card max-w-2xl space-y-5 p-7" onSubmit={handleSubmit}>
        <span className="t-avatar">MO</span>
        <label className="t-label">
          Nome do professor
          <input className="t-input" defaultValue={teacher.name} required />
        </label>
        <label className="t-label">
          E-mail
          <input type="email" className="t-input" defaultValue={teacher.email} required />
        </label>
        <label className="t-label">
          Instituição
          <input className="t-input" defaultValue="Escola Técnica Horizonte" />
        </label>
        <label className="flex items-center gap-3 text-sm">
          <input type="checkbox" defaultChecked />
          Receber avisos de atividades das turmas
        </label>
        <p className="text-xs text-slate-400">
          Os dados desta página são fictícios e não alteram sua conta.
        </p>
        <button className="t-btn">Salvar preferências</button>
      </form>
    </>
  )
}
