import { authApi } from '../../../services/authApi'
import { useState } from 'react'
import type { FormEvent } from 'react'
import type { Lesson } from '../../../types/education'
import { Modal } from '../../../components/ui'
import { useTeacher } from '../../../contexts/TeacherContext'

type StartLessonModalProps = {
  starting: string | number
  onClose: () => void
  onStarted: (lesson: Lesson) => void
}
export default function StartLessonModal({ starting, onClose, onStarted }: StartLessonModalProps) {
  const { classrooms, notify } = useTeacher()

  const [pending, setPending] = useState(false)
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const title = String(data.get('title')).trim()
    const classroomId = String(data.get('classroom') || '')
    if (!title) return
    setPending(true)
    try {
      const lesson = await authApi.createLesson(title, classroomId)
      onStarted(lesson)
      onClose()
      notify(`Iniciando aula: ${title}`)
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Não foi possível iniciar a aula.')
    } finally {
      setPending(false)
    }
  }

  return (
    <Modal title="Iniciar nova aula" onClose={onClose}>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <label className="t-label">
          Título da aula
          <input
            name="title"
            className="t-input"
            required
            placeholder="O que vamos aprender hoje?"
          />
        </label>
        <label className="t-label">
          Turma
          <select
            name="classroom"
            className="t-input"
            defaultValue={starting === 'choose' ? '' : starting}
            required
          >
            <option value="" disabled>
              Selecione uma turma
            </option>
            {classrooms
              .filter((item) => !item.archived)
              .map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
          </select>
        </label>
        <button className="t-btn" disabled={pending}>
          {pending ? 'Iniciando…' : 'Iniciar aula'}
        </button>
      </form>
    </Modal>
  )
}
