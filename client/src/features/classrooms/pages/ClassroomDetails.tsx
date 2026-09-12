import type { FormEvent } from 'react'
import { useState } from 'react'
import { Copy, MoreHorizontal, Send, Video } from 'lucide-react'
import { Modal, Tabs } from '../../../components/ui'
import { useTeacher } from '../../../contexts/TeacherContext'
import { teacher } from '../../../data/teacherDemo'
import type { Classroom, Post } from '../../../types/education'
import LessonList from '../../lessons/components/LessonList'
import Materials from '../../materials/pages/Materials'
import Students from '../../students/pages/Students'

export default function ClassroomDetails({
  classroom,
  posts,
  setPosts,
}: {
  classroom: Classroom
  posts: Post[]
  setPosts: (posts: Post[]) => void
}) {
  const { lessons, students, copy, startLesson, editClassroom, classrooms, setClassrooms, notify } =
    useTeacher()
  const [tab, setTab] = useState('Mural')
  const [draft, setDraft] = useState('')
  const [postMenu, setPostMenu] = useState<number | null>(null)
  const [archive, setArchive] = useState(false)
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!draft.trim()) return
    setPosts([
      { id: Date.now(), classroomId: classroom.id, text: draft.trim(), date: 'Agora' },
      ...posts,
    ])
    setDraft('')
    notify('Aviso publicado na turma.')
  }

  return (
    <>
      <header
        className={`class-banner banner-${classroom.color} mb-3 rounded-2xl p-6 text-white sm:p-8`}
      >
        <p className="mb-3 text-xs uppercase tracking-widest text-white/70">
          {classroom.subject}
          {classroom.archived && ' · Arquivada'}
        </p>
        <h1 className="font-ui text-3xl font-bold">{classroom.name}</h1>
        <p className="mt-3 text-sm text-white/70">Professor {teacher.name}</p>
        <section className="mt-7 flex flex-wrap items-center justify-between gap-4">
          <button
            className="flex items-center gap-3 rounded-lg border border-white/25 px-4 py-2 text-sm"
            onClick={() => copy(classroom.code)}
          >
            Código da turma: <strong>{classroom.code}</strong>
            <Copy size={15} />
          </button>
          <button
            className="flex items-center gap-2 rounded-lg bg-white px-5 py-3 text-sm font-bold text-primary"
            onClick={() => startLesson(classroom.id)}
          >
            <Video size={17} />
            Iniciar aula
          </button>
        </section>
      </header>
      <Tabs
        items={['Mural', 'Aulas', 'Materiais', 'Pessoas', 'Sobre']}
        value={tab}
        onChange={setTab}
      />
      {tab === 'Mural' && (
        <section className="grid gap-6 lg:grid-cols-[1fr_260px]">
          <section>
            <form className="t-card mb-5 p-5" onSubmit={handleSubmit}>
              <label className="t-label">
                Compartilhe com sua turma
                <textarea
                  className="t-input mt-3 min-h-24 resize-y"
                  placeholder="Escreva um aviso, uma ideia ou uma orientação..."
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  required
                />
              </label>
              <section className="mt-3 flex justify-end">
                <button className="t-btn" disabled={!draft.trim()}>
                  <Send size={15} />
                  Publicar aviso
                </button>
              </section>
            </form>
            {posts
              .filter((post) => post.classroomId === classroom.id)
              .map((post) => (
                <article key={post.id} className="t-card mb-4 p-5">
                  <header className="flex items-center gap-3">
                    <span className="t-avatar">MO</span>
                    <section className="flex-1">
                      <h3 className="text-sm font-bold">{teacher.name}</h3>
                      <p className="mt-1 text-xs text-slate-400">{post.date}</p>
                    </section>
                    <section className="relative">
                      <button
                        className="t-icon"
                        aria-label="Opções da publicação"
                        aria-expanded={postMenu === post.id}
                        onClick={() => setPostMenu(postMenu === post.id ? null : post.id)}
                      >
                        <MoreHorizontal size={18} />
                      </button>
                      {postMenu === post.id && (
                        <button
                          className="absolute right-0 z-10 w-40 rounded-lg border border-slate-200 bg-white p-3 text-sm text-red-600 shadow-lg"
                          onClick={() => {
                            setPosts(posts.filter((item) => item.id !== post.id))
                            setPostMenu(null)
                            notify('Publicação excluída.')
                          }}
                        >
                          Excluir publicação
                        </button>
                      )}
                    </section>
                  </header>
                  <p className="mt-5 whitespace-pre-wrap text-sm leading-7 text-slate-600">
                    {post.text}
                  </p>
                </article>
              ))}
            {!posts.some((post) => post.classroomId === classroom.id) && (
              <p className="p-6 text-center text-sm text-slate-500">
                Seu mural está pronto para o primeiro aviso.
              </p>
            )}
          </section>
          <aside className="t-card h-fit p-5">
            <h2 className="mb-4 text-sm font-bold">Informações da turma</h2>
            <p className="text-sm leading-6 text-slate-500">{classroom.description}</p>
            <hr className="my-5 border-slate-100" />
            <p className="text-xs text-slate-500">
              {students.filter((student) => student.classroomIds.includes(classroom.id)).length}{' '}
              alunos · {lessons.filter((lesson) => lesson.classroomId === classroom.id).length}{' '}
              aulas
            </p>
            <p className="mt-4 text-xs text-primary">Um espaço acessível para aprender juntos.</p>
          </aside>
        </section>
      )}
      {tab === 'Aulas' && (
        <>
          <button className="t-btn mb-5" onClick={() => startLesson(classroom.id)}>
            <Video size={16} />
            Iniciar nova aula
          </button>
          <LessonList lessons={lessons.filter((lesson) => lesson.classroomId === classroom.id)} />
        </>
      )}
      {tab === 'Materiais' && <Materials classroomId={classroom.id} />}
      {tab === 'Pessoas' && <Students classroomId={classroom.id} />}
      {tab === 'Sobre' && (
        <article className="t-card p-7">
          <h2 className="mb-5 text-xl font-bold">Sobre a turma</h2>
          <p className="mb-6 max-w-2xl leading-7 text-slate-600">
            {classroom.description || 'Esta turma ainda não tem uma descrição.'}
          </p>
          <dl className="grid gap-5 text-sm sm:grid-cols-2">
            <section>
              <dt className="text-slate-400">Disciplina</dt>
              <dd className="mt-1 font-semibold">{classroom.subject}</dd>
            </section>
            <section>
              <dt className="text-slate-400">Professor responsável</dt>
              <dd className="mt-1 font-semibold">{teacher.name}</dd>
            </section>
            <section>
              <dt className="text-slate-400">Código</dt>
              <dd className="mt-1 font-semibold">{classroom.code}</dd>
            </section>
            <section>
              <dt className="text-slate-400">Período</dt>
              <dd className="mt-1 font-semibold">2º semestre de 2026</dd>
            </section>
          </dl>
          <section className="mt-8 flex flex-wrap gap-3">
            <button className="t-btn" onClick={() => editClassroom(classroom)}>
              Editar dados
            </button>
            <button className="t-btn-secondary" onClick={() => setArchive(true)}>
              {classroom.archived ? 'Reativar turma' : 'Arquivar turma'}
            </button>
          </section>
        </article>
      )}
      {archive && (
        <Modal
          title={classroom.archived ? 'Reativar turma?' : 'Arquivar turma?'}
          onClose={() => setArchive(false)}
        >
          <p className="mb-6 text-sm text-slate-500">
            A turma continuará disponível no filtro de turmas{' '}
            {classroom.archived ? 'ativas' : 'arquivadas'}.
          </p>
          <button
            className="t-btn"
            onClick={() => {
              setClassrooms(
                classrooms.map((item) =>
                  item.id === classroom.id ? { ...item, archived: !item.archived } : item,
                ),
              )
              setArchive(false)
              notify('Status da turma atualizado.')
            }}
          >
            Confirmar
          </button>
        </Modal>
      )}
    </>
  )
}
