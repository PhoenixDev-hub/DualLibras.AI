import { useEffect, useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  FileText,
  GraduationCap,
  Hand,
  RefreshCw,
  Users,
  Video,
} from 'lucide-react'
import { authApi, type DashboardUser, type EducationData } from '../../services/authApi'
import { AUTH_API_BASE } from '../../config/backend'
import { Navigate } from 'react-router-dom'
import DashboardShell from '../../components/layout/DashboardShell'
import { PageTitle } from '../../components/ui'
import LibrasPractice from '../libras/components/LibrasPractice'
import LessonList from '../lessons/components/LessonList'
import StudentLessonAvatar from './StudentLessonAvatar'
import SignPlayer from './SignPlayer'

const pages = [
  { label: 'Minha turma', icon: Users },
  { label: 'Minhas aulas', icon: BookOpen },
  { label: 'Materiais', icon: FileText },
  { label: 'Resumos', icon: GraduationCap },
  { label: 'Aprender Libras', icon: Hand },
] as const
const statuses = {
  live: 'Em andamento',
  finished: 'Finalizada',
  scheduled: 'Agendada',
  cancelled: 'Cancelada',
}

export default function StudentDashboard({
  user,
  initialData,
  logout,
}: {
  user: DashboardUser
  initialData: EducationData
  logout: () => Promise<void>
}) {
  const [data, setData] = useState(initialData)
  const [page, setPage] = useState<string>('Minha turma')
  const [room, setRoom] = useState('')
  const [lessonId, setLessonId] = useState<string | number | null>(null)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [notice, setNotice] = useState('')
  const [refreshing, setRefreshing] = useState(false)
  const lesson = data.lessons.find((item) => item.id === lessonId)
  const lessons = data.lessons.filter((item) => !room || String(item.classroomId) === room)
  const materials = data.materials.filter(
    (item) =>
      (!room || String(item.classroomId) === room) &&
      (!lesson ||
        item.lessonId === lesson.id ||
        (!item.lessonId && item.classroomId === lesson.classroomId)),
  )
  async function refresh() {
    setRefreshing(true)
    try {
      setData(await authApi.education())
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível atualizar as aulas.')
    } finally {
      setRefreshing(false)
    }
  }
  useEffect(() => {
    if (lesson?.status !== 'live') return
    let active = true
    const timer = window.setInterval(() => {
      void authApi
        .education()
        .then((next) => {
          if (active) {
            setData(next)
            setError('')
          }
        })
        .catch(() => {
          if (active) setError('Não foi possível atualizar a aula. Tente novamente.')
        })
    }, 5000)
    return () => {
      active = false
      window.clearInterval(timer)
    }
  }, [lesson?.id, lesson?.status])
  function navigate(next: string) {
    setPage(next)
    setLessonId(null)
  }
  const roomName = (id: string | number) =>
    data.classrooms.find((item) => item.id === id)?.name ?? 'Sua turma'
  const materialList = (
    <div className="grid gap-4 md:grid-cols-2">
      {materials.length ? (
        materials.map((item) => (
          <article className="t-card flex items-center gap-4 p-5" key={item.id}>
            <FileText className="shrink-0 text-primary" />
            <div className="min-w-0 flex-1">
              <h3 className="break-words font-semibold">{item.name}</h3>
              <p className="text-sm text-slate-500">
                {item.type} · {roomName(item.classroomId)}
              </p>
            </div>
            <a
              className="t-btn-secondary"
              href={`${AUTH_API_BASE}/education/materials/${encodeURIComponent(item.id)}/download`}
              target="_blank"
              rel="noreferrer"
              aria-label={`Abrir ${item.name}`}
            >
              Abrir
            </a>
          </article>
        ))
      ) : (
        <p className="t-card p-6 text-slate-500">
          O professor ainda não disponibilizou materiais{' '}
          {lesson ? 'para esta aula' : 'para suas turmas'}.
        </p>
      )}
    </div>
  )
  if (!data.classrooms.length)
    return <Navigate to="/codigo" replace state={{ needsClassroom: true }} />
  const breadcrumbs = [
    { label: 'Minha turma', onClick: () => navigate('Minha turma') },
    ...(page !== 'Minha turma' ? [{ label: page, onClick: () => setLessonId(null) }] : []),
    ...(lesson ? [{ label: lesson.title }] : []),
  ]
  return (
    <DashboardShell
      user={user}
      logout={logout}
      student
      navigation={pages}
      page={page}
      breadcrumbs={breadcrumbs}
      onNavigate={navigate}
      onBack={
        lesson
          ? () => setLessonId(null)
          : page !== 'Minha turma'
            ? () => navigate('Minha turma')
            : undefined
      }
      onSearch={(value) => {
        setQuery(value.trim())
        setRoom('')
        navigate('Minha turma')
      }}
      onNotice={setNotice}
    >
      <PageTitle
        eyebrow="Seu espaço de aprendizado"
        title={lesson?.title ?? page}
        description="Aprenda no seu ritmo, com leitura e Libras lado a lado."
        action={
          <a className="t-btn-secondary" href="/codigo">
            Entrar em outra turma
          </a>
        }
      />
      {notice && (
        <div
          role="status"
          className="mb-5 flex items-center justify-between gap-3 rounded-xl bg-blue-50 p-4 text-sm text-primary"
        >
          {notice}
          <button className="t-btn-secondary" onClick={() => setNotice('')}>
            Fechar
          </button>
        </div>
      )}
      {error && (
        <p role="alert" className="mb-4 rounded-xl bg-red-50 p-4 text-red-700">
          {error}
        </p>
      )}
      {page !== 'Aprender Libras' && (
        <div className="mb-6 flex flex-wrap items-center gap-3">
          {lesson ? (
            <button className="t-btn-secondary" onClick={() => setLessonId(null)}>
              <ArrowLeft size={16} /> Voltar
            </button>
          ) : (
            <label className="flex items-center gap-3 text-sm">
              Turma
              <select className="t-input" value={room} onChange={(e) => setRoom(e.target.value)}>
                <option value="">Todas as turmas</option>
                {data.classrooms.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
          )}
          <button className="t-btn-secondary" disabled={refreshing} onClick={() => void refresh()}>
            <RefreshCw size={16} />
            {refreshing ? 'Atualizando…' : 'Atualizar'}
          </button>
        </div>
      )}
      {page === 'Minha turma' ? (
        <div className="grid gap-5 sm:grid-cols-2">
          {query && (
            <div className="col-span-full flex flex-wrap items-center gap-3 text-sm text-slate-500">
              <p>Resultados para “{query}”</p>
              <button className="t-btn-secondary" onClick={() => setQuery('')}>
                Limpar busca
              </button>
            </div>
          )}
          {query &&
            !data.classrooms.some((item) =>
              `${item.name} ${item.teacherName ?? ''} ${item.subject}`
                .toLocaleLowerCase('pt-BR')
                .includes(query.toLocaleLowerCase('pt-BR')),
            ) && (
              <p className="t-card col-span-full p-6 text-slate-500">Nenhuma turma encontrada.</p>
            )}
          {data.classrooms
            .filter(
              (item) =>
                (!room || String(item.id) === room) &&
                (!query ||
                  `${item.name} ${item.teacherName ?? ''} ${item.subject}`
                    .toLocaleLowerCase('pt-BR')
                    .includes(query.toLocaleLowerCase('pt-BR'))),
            )
            .map((classroom) => (
              <article key={classroom.id} className="t-card flex flex-col p-6">
                <div className="mb-4 flex items-center gap-3 text-primary">
                  <Users size={24} />
                  <span className="text-sm font-semibold">Minha turma</span>
                </div>
                <h2 className="text-xl font-bold">{classroom.name}</h2>
                <p className="mt-2 text-sm text-slate-600">
                  Professor: {classroom.teacherName || 'Não informado'}
                </p>
                {classroom.subject && (
                  <p className="mt-1 text-sm text-primary">{classroom.subject}</p>
                )}
                {classroom.description && (
                  <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-6 text-slate-500">
                    {classroom.description}
                  </p>
                )}
                <p className="my-5 text-sm text-slate-500">
                  {data.lessons.filter((item) => item.classroomId === classroom.id).length} aulas ·{' '}
                  {data.materials.filter((item) => item.classroomId === classroom.id).length}{' '}
                  materiais
                </p>
                <div className="mt-auto flex flex-wrap gap-2">
                  <button
                    className="t-btn"
                    onClick={() => {
                      setRoom(String(classroom.id))
                      navigate('Minhas aulas')
                    }}
                  >
                    Ver aulas
                  </button>
                  <button
                    className="t-btn-secondary"
                    onClick={() => {
                      setRoom(String(classroom.id))
                      navigate('Materiais')
                    }}
                  >
                    Ver materiais
                  </button>
                  <button
                    className="t-btn-secondary"
                    onClick={() => {
                      setRoom(String(classroom.id))
                      navigate('Resumos')
                    }}
                  >
                    Ver resumos
                  </button>
                </div>
              </article>
            ))}
          {!data.classrooms.length && (
            <section className="t-card col-span-full p-8">
              <Users size={32} className="mb-4 text-primary" />
              <h2 className="font-bold">Você ainda não entrou em uma turma</h2>
              <p className="my-4 text-slate-500">
                Peça o código ao professor para acessar sua turma, aulas e materiais.
              </p>
              <a className="t-btn" href="/codigo">
                Entrar com código
              </a>
            </section>
          )}
        </div>
      ) : page === 'Aprender Libras' ? (
        <LibrasPractice />
      ) : lesson ? (
        page === 'Minhas aulas' ? (
          <StudentLessonAvatar key={lesson.id} lesson={lesson} materials={materialList} />
        ) : (
          <div className="space-y-7">
            <article className="t-card p-6">
              <h2 className="mb-4 font-bold">Resumo escrito</h2>
              <p className="whitespace-pre-wrap leading-8">
                {lesson.summary || 'O professor ainda não disponibilizou o resumo desta aula.'}
              </p>
            </article>
            {lesson.summary && (
              <SignPlayer
                key={`summary-${lesson.id}`}
                text={lesson.summary}
                title="Resumo em Libras"
              />
            )}
            <section>
              <h2 className="mb-4 font-bold">Materiais usados pelo professor</h2>
              {materialList}
            </section>
          </div>
        )
      ) : page === 'Materiais' ? (
        materialList
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {lessons.length ? (
            lessons.map((item) => (
              <article key={item.id} className="t-card flex flex-col items-start p-6">
                <span className="t-badge-neutral">{statuses[item.status]}</span>
                <p className="mt-4 text-sm text-primary">{roomName(item.classroomId)}</p>
                <h2 className="mb-2 mt-1 text-xl font-bold">{item.title}</h2>
                <p className="mb-6 text-sm text-slate-500">
                  {new Date(item.date).toLocaleDateString('pt-BR')} · {item.duration}
                </p>
                <button className="t-btn mt-auto" onClick={() => setLessonId(item.id)}>
                  {page === 'Resumos'
                    ? 'Ver resumo'
                    : item.status === 'live'
                      ? 'Acompanhar aula'
                      : 'Ver aula'}
                </button>
              </article>
            ))
          ) : (
            <div className="t-card col-span-full p-8">
              <BookOpen className="mb-4 text-primary" size={32} />
              <h2 className="font-bold">Suas aulas aparecerão aqui</h2>
              <p className="mt-2 text-slate-500">
                Entre em uma turma com o código do professor e aguarde a publicação das aulas.
              </p>
            </div>
          )}
        </div>
      )}
    </DashboardShell>
  )
}
