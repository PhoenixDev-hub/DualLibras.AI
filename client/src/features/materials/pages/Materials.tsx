import { useState, type FormEvent } from 'react'
import { Empty, PageTitle } from '../../../components/ui'
import { useTeacher } from '../../../contexts/TeacherContext'
import { authApi } from '../../../services/authApi'
export default function Materials({ classroomId }: { classroomId?: string | number }) {
  const { materials, refresh, user } = useTeacher()
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState('')
  async function upload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const file = new FormData(form).get('file')
    if (!(file instanceof File) || !file.size) return
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
      const result = await authApi.uploadMaterial({ filename: file.name, contentBase64 })
      form.reset()
      setMessage(
        result.ai.sent
          ? 'Material salvo e enviado para processamento.'
          : 'Material salvo. Envio ao serviço de transcrição pendente.',
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
  const filtered = materials.filter((m) => !classroomId || m.classroomId === classroomId)
  return (
    <>
      <PageTitle
        title="Materiais"
        description="Arquivos cadastrados na sua conta e nas suas aulas."
      />
      {!classroomId && (user?.role === 'PROFESSOR' || user?.role === 'ADMIN') && (
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
          <p className="text-sm">
            Até 25 MiB. O arquivo será salvo na sua conta, sem vínculo com uma turma.
          </p>
          <button className="t-btn" disabled={pending}>
            {pending ? 'Enviando…' : 'Enviar material'}
          </button>
        </form>
      )}
      <p role="status">{message}</p>
      {filtered.map((m) => (
        <article className="t-card mb-3 p-5" key={m.id}>
          <h2>{m.name}</h2>
          <p className="text-sm text-slate-500">{m.type}</p>
        </article>
      ))}
      {!filtered.length && <Empty text="Nenhum material cadastrado." />}
    </>
  )
}
