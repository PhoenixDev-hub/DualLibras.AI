import type { FormEvent } from 'react'
import { useState } from 'react'
import { FileText, Plus, Upload } from 'lucide-react'
import { Empty, Modal, PageTitle } from '../../../components/ui'
import { useTeacher } from '../../../contexts/TeacherContext'
export default function Materials({ classroomId }: { classroomId?: number }) {
  const { materials, setMaterials, classrooms, notify } = useTeacher()
  const [adding, setAdding] = useState(false)
  const filtered = materials.filter((item) => !classroomId || item.classroomId === classroomId)
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const name = String(data.get('name')).trim()
    if (!name) return
    setMaterials([
      ...materials,
      {
        id: Date.now(),
        name,
        subject: String(data.get('subject')).trim() || 'Geral',
        type: String(data.get('type')),
        classroomId: classroomId ?? Number(data.get('classroom')),
      },
    ])
    setAdding(false)
    notify('Material fictício adicionado. Nenhum arquivo foi enviado.')
  }

  return (
    <>
      <PageTitle
        title="Materiais"
        description="Recursos para apoiar cada etapa do aprendizado."
        action={
          <button className="t-btn" onClick={() => setAdding(true)}>
            <Plus size={16} />
            Adicionar material
          </button>
        }
      />
      {filtered.length ? (
        [...new Set(filtered.map((item) => item.subject))].map((subject) => (
          <section key={subject} className="mb-6">
            <h3 className="mb-3 text-sm font-bold text-slate-500">{subject}</h3>
            <section className="grid gap-3 md:grid-cols-2">
              {filtered
                .filter((item) => item.subject === subject)
                .map((item) => (
                  <button
                    key={item.id}
                    className="t-card flex items-center gap-4 p-5 text-left hover:border-primary"
                    onClick={() =>
                      notify(
                        `${item.name}: arquivo fictício (${item.type}). A visualização está representada nesta demonstração.`,
                      )
                    }
                  >
                    <span className="rounded-xl bg-blue-50 p-3 text-primary">
                      <FileText size={23} />
                    </span>
                    <section>
                      <h4 className="text-sm font-semibold">{item.name}</h4>
                      <p className="mt-1 text-xs text-slate-400">
                        {item.type} ·{' '}
                        {classrooms.find((room) => room.id === item.classroomId)?.name}
                      </p>
                    </section>
                  </button>
                ))}
            </section>
          </section>
        ))
      ) : (
        <Empty text="Nenhum material adicionado. Compartilhe o primeiro recurso da turma." />
      )}
      {adding && (
        <Modal title="Adicionar material" onClose={() => setAdding(false)}>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <section className="rounded-xl border-2 border-dashed border-blue-200 bg-blue-50 p-6 text-center">
              <Upload className="mx-auto mb-2 text-primary" />
              <p className="text-sm">Prévia visual de envio</p>
              <p className="mt-2 text-xs text-slate-500">
                Preencha os dados abaixo para simular um material, sem upload.
              </p>
            </section>
            <label className="t-label">
              Nome do material
              <input name="name" className="t-input" required />
            </label>
            <label className="t-label">
              Assunto
              <input name="subject" className="t-input" required />
            </label>
            <label className="t-label">
              Tipo
              <select name="type" className="t-input">
                <option>PDF</option>
                <option>Apresentação</option>
                <option>Documento</option>
                <option>Link</option>
              </select>
            </label>
            {!classroomId && (
              <label className="t-label">
                Turma
                <select name="classroom" className="t-input" required>
                  {classrooms.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <button className="t-btn">Adicionar à turma</button>
          </form>
        </Modal>
      )}
    </>
  )
}
