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

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const title = String(data.get('title')).trim()
    const classroomId = String(data.get('classroom') || '')
    if (!title) return
    const id = Date.now()
    onStarted({
      id,
      title,
      classroomId,
      date: new Date().toISOString(),
      duration: '0 min',
      status: 'live',
    })
    onClose()
    notify(`Iniciando aula: ${title}`)
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
        <button className="t-btn">Iniciar aula</button>
      </form>
    </Modal>
  )
}
