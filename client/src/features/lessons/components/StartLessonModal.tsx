import type { FormEvent } from 'react'
import { Modal } from '../../../components/ui'
import { useTeacher } from '../../../contexts/TeacherContext'

type StartLessonModalProps = { starting: number | 'choose'; onClose: () => void }
export default function StartLessonModal({ starting, onClose }: StartLessonModalProps) {
  const { classrooms, lessons, setLessons, openLesson, notify } = useTeacher()
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const title = String(data.get('title')).trim()
    if (!title) return
    const id = Date.now()
    setLessons([
      {
        id,
        title,
        classroomId: Number(data.get('classroom')),
        date: new Date().toLocaleDateString('pt-BR'),
        duration: '0 min',
        status: 'live',
      },
      ...lessons,
    ])
    onClose()
    openLesson(id)
    notify('Aula demonstrativa iniciada. Nenhum microfone foi acessado.')
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
        <button className="t-btn">Iniciar demonstração</button>
      </form>
    </Modal>
  )
}
