import { useEffect, useState, type FormEvent } from 'react'
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
  const ownedClassrooms = classrooms.filter((room) => room.canAttachMaterials)
  const [selectedClassroom, setSelectedClassroom] = useState(String(classroomId ?? ''))
  const targetClassroom = classroomId ? String(classroomId) : selectedClassroom
  const canUpload =
    (user?.role === 'PROFESSOR' || user?.role === 'ADMIN') &&
    (classroomId
      ? ownedClassrooms.some((room) => String(room.id) === String(classroomId))
      : ownedClassrooms.length > 0)
  const [uploadOptions, setUploadOptions] = useState<{
    extensions: string[]
    maxBytes: number
  } | null>(null)
  const [optionsError, setOptionsError] = useState('')
  const [optionsVersion, setOptionsVersion] = useState(0)
  useEffect(() => {
    if (!canUpload) return
    let active = true
    authApi
      .materialUploadOptions()
      .then((options) => {
        if (active) {
          setUploadOptions(options)
          setOptionsError('')
        }
      })
      .catch(() => {
        if (active) setOptionsError('Não foi possível carregar os formatos e o limite de envio.')
      })
    return () => {
      active = false
    }
  }, [canUpload, optionsVersion])
  const availableLessons = lessons.filter(
    (item) =>
      targetClassroom &&
      String(item.classroomId) === targetClassroom &&
      (!lessonId || item.id === lessonId),
  )
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState('')
  async function upload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pending || !canUpload || !uploadOptions) return
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
    const extension = `.${file.name.split('.').pop()?.toLowerCase()}`
    if (!uploadOptions.extensions.includes(extension)) {
      setMessage(`Formato inválido. Escolha: ${uploadOptions.extensions.join(', ')}.`)
      return
    }
    if (file.size > uploadOptions.maxBytes) {
      setMessage(`O arquivo deve ter no máximo ${uploadOptions.maxBytes / (1024 * 1024)} MiB.`)
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
      await authApi.uploadMaterial({
        filename: file.name,
        contentBase64,
        lessonId: selectedLesson || undefined,
        classroomId: targetClassroom || undefined,
      })
      const fileInput = form.elements.namedItem('file')
      if (fileInput instanceof HTMLInputElement) fileInput.value = ''
      setMessage('Arquivo anexado. Os participantes da sala já podem acessar.')
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
      (!classroomId || m.classroomId === classroomId) &&
      (!lessonId || m.lessonId === lessonId || !m.lessonId),
  )
  return (
    <>
      <PageTitle
        title="Materiais"
        description="Arquivos compartilhados pelo professor com os participantes da sala."
      />
      {canUpload && (
        <form onSubmit={upload} className="t-card mb-5 space-y-4 p-5">
          <label className="t-label">
            Enviar arquivo
            <input
              type="file"
              name="file"
              required
              accept={uploadOptions?.extensions.join(',')}
              aria-describedby="upload-rules"
              disabled={pending || !uploadOptions}
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
                disabled={pending || !uploadOptions}
              >
                <option value="" disabled>
                  Selecione a turma
                </option>
                {ownedClassrooms.map((room) => (
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
              disabled={pending || !uploadOptions || !!lessonId || !targetClassroom}
            >
              <option value="">Compartilhar com toda a turma</option>
              {availableLessons.map((lesson) => (
                <option key={lesson.id} value={lesson.id}>
                  {lesson.title}
                </option>
              ))}
            </select>
          </label>
          <p id="upload-rules" className="text-sm">
            {uploadOptions
              ? `${uploadOptions.extensions.join(', ')}. Até ${uploadOptions.maxBytes / (1024 * 1024)} MiB por arquivo.`
              : 'Carregando formatos e limite de envio…'}{' '}
            O professor responsável e a administração podem anexar. Arquivos disponíveis aos
            participantes da sala e à administração.
          </p>
          {optionsError && (
            <p role="alert">
              {optionsError}{' '}
              <button
                type="button"
                className="t-btn-secondary"
                onClick={() => setOptionsVersion((value) => value + 1)}
              >
                Tentar novamente
              </button>
            </p>
          )}
          <button
            className="t-btn"
            disabled={pending || !uploadOptions || (!targetClassroom && !lessonId)}
          >
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
          <p className="mb-3 text-sm text-slate-500">
            {m.type} ·{' '}
            {m.lessonId
              ? (lessons.find((lesson) => lesson.id === m.lessonId)?.title ?? 'Material da aula')
              : 'Material da sala'}
          </p>
          <a
            className="t-btn-secondary"
            href={`${AUTH_API_BASE}/education/materials/${encodeURIComponent(m.id)}/download`}
            target="_blank"
            rel="noreferrer"
          >
            Baixar arquivo
          </a>
        </article>
      ))}
      {!filtered.length && <Empty text="Nenhum material cadastrado." />}
    </>
  )
}
