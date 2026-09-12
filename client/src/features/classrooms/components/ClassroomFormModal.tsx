import type { FormEvent } from 'react'
import { Modal } from '../../../components/ui'
import { useTeacher } from '../../../contexts/TeacherContext'
import type { Classroom } from '../../../types/education'

type ClassroomFormModalProps = {
  editor: Classroom | 'new'
  onClose: () => void
  onCreated: (code: string) => void
}
export default function ClassroomFormModal({
  editor,
  onClose,
  onCreated,
}: ClassroomFormModalProps) {
  const { classrooms, setClassrooms, notify } = useTeacher()
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const name = String(data.get('name')).trim()
    const subject = String(data.get('subject')).trim()
    if (!name || !subject) return
    const fields = { name, subject, description: String(data.get('description')).trim() }
    if (editor === 'new') {
      const id = Date.now()
      const code = `DL-${(Math.max(...classrooms.map((item) => Number(item.code.slice(3))), 1000) + 1).toString()}`
      setClassrooms([
        ...classrooms,
        {
          ...fields,
          id,
          code,
          archived: false,
          color: ['blue', 'teal', 'violet'][classrooms.length % 3],
        },
      ])
      onCreated(code)
    } else {
      setClassrooms(
        classrooms.map((item) => (item.id === editor.id ? { ...item, ...fields } : item)),
      )
      notify('Dados da turma atualizados.')
    }
    onClose()
  }

  return (
    <Modal title={editor === 'new' ? 'Criar turma' : 'Editar turma'} onClose={onClose}>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <label className="t-label">
          Nome da turma
          <input
            className="t-input"
            name="name"
            placeholder="Ex.: 2º Informática A"
            defaultValue={editor === 'new' ? '' : editor.name}
            required
          />
        </label>
        <label className="t-label">
          Disciplina
          <input
            className="t-input"
            name="subject"
            placeholder="Ex.: Programação"
            defaultValue={editor === 'new' ? '' : editor.subject}
            required
          />
        </label>
        <label className="t-label">
          Descrição
          <textarea
            className="t-input min-h-24"
            name="description"
            defaultValue={editor === 'new' ? '' : editor.description}
          />
        </label>
        <p className="text-xs text-slate-400">
          Os dados ficam disponíveis apenas durante esta demonstração.
        </p>
        <section className="flex justify-end gap-3">
          <button type="button" className="t-btn-secondary" onClick={onClose}>
            Cancelar
          </button>
          <button className="t-btn">
            {editor === 'new' ? 'Criar turma' : 'Salvar alterações'}
          </button>
        </section>
      </form>
    </Modal>
  )
}
