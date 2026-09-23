import { authApi } from '../../../services/authApi'
import { useState, type FormEvent } from 'react'
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
  const { refresh, notify } = useTeacher()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const fields = {
      name: String(data.get('name')).trim(),
      description: String(data.get('description')).trim(),
    }
    setPending(true)
    setError('')
    try {
      if (editor === 'new') {
        const result = await authApi.createClassroom(fields.name, fields.description)
        onCreated(result.classroom.code)
      } else await authApi.updateClassroom(editor.id, fields)
      try {
        await refresh()
      } catch {
        notify('Turma salva. Atualize a página para recarregar a lista.')
      }
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível salvar.')
    } finally {
      setPending(false)
    }
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
          Descrição
          <textarea
            className="t-input min-h-24"
            name="description"
            defaultValue={editor === 'new' ? '' : editor.description}
          />
        </label>
        <p className="text-xs text-slate-400 dark:text-slate-400">
          Nome e descrição são salvos no banco. A disciplina vem do perfil do professor.
        </p>
        <section className="flex justify-end gap-3">
          <button type="button" className="t-btn-secondary" onClick={onClose}>
            Cancelar
          </button>
          {error && <p role="alert">{error}</p>}
          <button className="t-btn" disabled={pending}>
            {pending ? 'Salvando…' : editor === 'new' ? 'Criar turma' : 'Salvar alterações'}
          </button>
        </section>
      </form>
    </Modal>
  )
}
