import type { FormEvent } from 'react'
import { useState } from 'react'
import { CheckCircle, Download, Pencil } from 'lucide-react'
import { Modal, PageTitle, Tabs } from '../../../components/ui'
import { useTeacher } from '../../../contexts/TeacherContext'
import { transcript } from '../../../data/teacherDemo'
import type { Lesson } from '../../../types/education'
import Materials from '../../materials/pages/Materials'
export default function LessonDetails({ lesson }: { lesson: Lesson }) {
  const { classrooms, lessons, setLessons, notify } = useTeacher()
  const [tab, setTab] = useState('Transcrição')
  const [editing, setEditing] = useState(false)
  const [shared, setShared] = useState(false)
  function download() {
    const blob = new Blob([`${lesson.title}\n\n${transcript}`], {
      type: 'text/plain;charset=utf-8',
    })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'transcricao-demonstrativa.txt'
    anchor.click()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
    notify('Transcrição fictícia baixada.')
  }
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const title = String(new FormData(event.currentTarget).get('title')).trim()
    if (!title) return
    setLessons(lessons.map((item) => (item.id === lesson.id ? { ...item, title } : item)))
    setEditing(false)
    notify('Título atualizado.')
  }

  return (
    <>
      <PageTitle
        title={lesson.title}
        description={`${classrooms.find((item) => item.id === lesson.classroomId)?.name} · ${lesson.date} · ${lesson.duration}`}
        action={
          <span className="t-badge-neutral">
            <CheckCircle size={14} />
            Aula finalizada
          </span>
        }
      />
      <section className="mb-5 flex flex-wrap gap-3">
        <button className="t-btn-secondary" onClick={() => setEditing(true)}>
          <Pencil size={16} />
          Editar título
        </button>
        <button className="t-btn-secondary" onClick={download}>
          <Download size={16} />
          Baixar transcrição
        </button>
        <button
          className="t-btn"
          onClick={() => {
            setShared(!shared)
            notify(
              shared
                ? 'Conteúdo ocultado da turma na demonstração.'
                : 'Conteúdo disponibilizado para a turma na demonstração.',
            )
          }}
        >
          {shared ? 'Ocultar da turma' : 'Disponibilizar para a turma'}
        </button>
      </section>
      <Tabs items={['Transcrição', 'Resumo', 'Materiais']} value={tab} onChange={setTab} />
      {tab === 'Transcrição' && (
        <article className="t-card p-8">
          <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-primary">
            Transcrição demonstrativa
          </p>
          <p className="leading-8 text-slate-600">{transcript}</p>
        </article>
      )}
      {tab === 'Resumo' && (
        <article className="t-card p-8">
          <h2 className="mb-5 text-lg font-bold">Principais pontos · exemplo de resumo</h2>
          <ul className="list-disc space-y-4 pl-5 text-slate-600">
            <li>Algoritmos organizam uma solução em etapas.</li>
            <li>Variáveis armazenam informações que podem mudar.</li>
            <li>Estruturas de decisão orientam os próximos passos.</li>
            <li>Atividade sugerida: descrever um algoritmo do cotidiano.</li>
          </ul>
        </article>
      )}
      {tab === 'Materiais' && <Materials classroomId={lesson.classroomId} />}
      {editing && (
        <Modal title="Editar título da aula" onClose={() => setEditing(false)}>
          <form onSubmit={handleSubmit}>
            <label className="t-label">
              Título
              <input className="t-input" name="title" defaultValue={lesson.title} required />
            </label>
            <button className="t-btn mt-5">Salvar título</button>
          </form>
        </Modal>
      )}
    </>
  )
}
