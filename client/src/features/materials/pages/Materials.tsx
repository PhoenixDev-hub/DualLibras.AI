import { useState, type FormEvent } from 'react'
import { Empty, PageTitle } from '../../../components/ui'
import { useTeacher } from '../../../contexts/TeacherContext'
import { AUTH_API_BASE } from '../../../config/backend'
import { authApi } from '../../../services/authApi'
export default function Materials({
  classroomId,
  lessonId,
}: {
  classroomId?: string | number
  lessonId?: string | number
}) {
  const { materials, refresh, user, lessons, classrooms } = useTeacher()
  const [selectedClassroom, setSelectedClassroom] = useState(String(classroomId ?? ''))
  const targetClassroom = classroomId ? String(classroomId) : selectedClassroom
  const availableLessons = lessons.filter(
    (item) =>
      (!targetClassroom || String(item.classroomId) === targetClassroom) &&
      (!lessonId || item.id === lessonId),
  )
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState('')
  async function upload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const formData = new FormData(form)
    const selectedLesson = String(lessonId ?? formData.get('lessonId') ?? '')
    const file = formData.get('file')
    if (!(file instanceof File) || !file.size) {
      setMessage('Selecione um arquivo que não esteja vazio.')
      return
    }
    if (!selectedLesson && !targetClassroom) {
      setMessage('Selecione a turma para compartilhar o material.')
      return
    }
    if (file.size > 25 * 1024 * 1024) {
      setMessage('O arquivo deve ter no máximo 25 MiB.')
      return
    }
    setPending(true)
    setMessage('')
    try {
      const contentBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(String(reader.result))
        reader.onerror = () => reject(new Error('Não foi possível ler o arquivo.'))
        reader.readAsDataURL(file)
      })
      const result = await authApi.uploadMaterial({
        filename: file.name,
        contentBase64,
        lessonId: selectedLesson || undefined,
        classroomId: targetClassroom || undefined,
      })
      form.reset()
      setMessage(
        result.ai.sent
          ? 'Material anexado e disponível para os alunos.'
          : 'Material disponível para os alunos. Processamento de IA pendente.',
      )
      try {
        await refresh()
      } catch {
        setMessage('Material salvo. Atualize a página para recarregar a lista.')
      }
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Não foi possível enviar.')
    } finally {
      setPending(false)
    }
  }
  const filtered = materials.filter(
    (m) =>
      (!classroomId || m.classroomId === classroomId) && (!lessonId || m.lessonId === lessonId),
  )
  return (
    <>
      <PageTitle
        title="Materiais"
        description="Arquivos cadastrados na sua conta e nas suas aulas."
      />
      {(user?.role === 'PROFESSOR' || user?.role === 'ADMIN') && (
        <form onSubmit={upload} className="t-card mb-5 space-y-4 p-5">
          <label className="t-label">
            Enviar arquivo
            <input
              type="file"
              name="file"
              required
              accept=".pdf,.doc,.docx,.ppt,.pptx,.txt"
              disabled={pending}
            />
          </label>
          {!classroomId && !lessonId && (
            <label className="t-label">
              Turma
              <select
                name="classroomId"
                className="t-input"
                required
                value={selectedClassroom}
                onChange={(event) => setSelectedClassroom(event.target.value)}
                disabled={pending}
              >
                <option value="" disabled>
                  Selecione a turma
                </option>
                {classrooms.map((room) => (
                  <option key={room.id} value={room.id}>
                    {room.name}
                  </option>
                ))}
              </select>
            </label>
          )}
          <label className="t-label">
            {lessonId ? 'Aula deste material' : 'Disponibilizar na aula (opcional)'}
            <select
              key={targetClassroom}
              name="lessonId"
              className="t-input"
              defaultValue={lessonId ?? ''}
              disabled={pending || !!lessonId}
            >
              <option value="">Compartilhar com toda a turma</option>
              {availableLessons.map((lesson) => (
                <option key={lesson.id} value={lesson.id}>
                  {lesson.title}
                </option>
              ))}
            </select>
          </label>
          <p className="text-sm">
            Até 25 MiB. Anexe à turma inteira ou selecione uma aula específica.
          </p>
          <button className="t-btn" disabled={pending || (!targetClassroom && !lessonId)}>
            {pending ? 'Anexando…' : 'Anexar material para os alunos'}
          </button>
          {!availableLessons.length && (
            <p className="text-sm text-slate-500">
              Você pode anexar materiais à turma mesmo antes de iniciar uma aula.
            </p>
          )}
        </form>
      )}
      <p role="status">{message}</p>
      {filtered.map((m) => (
        <article className="t-card mb-3 p-5" key={m.id}>
          <h2>{m.name}</h2>
          <p className="mb-3 text-sm text-slate-500">{m.type}</p>
          <a
            className="t-btn-secondary"
            href={`${AUTH_API_BASE}/education/materials/${encodeURIComponent(m.id)}/download`}
            target="_blank"
            rel="noreferrer"
          >
            Abrir material
          </a>
        </article>
      ))}
      {!filtered.length && <Empty text="Nenhum material cadastrado." />}
    </>
  )
}
