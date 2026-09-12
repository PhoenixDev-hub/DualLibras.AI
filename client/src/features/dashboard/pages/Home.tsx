import { ArrowRight, BookOpen, CalendarDays, Hand, Plus, Users, Video } from 'lucide-react'
import { PageTitle } from '../../../components/ui'
import { useTeacher } from '../../../contexts/TeacherContext'
import ClassroomCard from '../../classrooms/components/ClassroomCard'
import LessonList from '../../lessons/components/LessonList'
export default function Home({ onNavigate }: { onNavigate: (page: string) => void }) {
  const { classrooms, students, lessons, editClassroom, startLesson, openLesson } = useTeacher()
  const live = lessons.find((lesson) => lesson.status === 'live')
  return (
    <>
      <PageTitle
        eyebrow="Seu espaço de ensino"
        title="Olá, Marina "
        description="Que bom ter você aqui. Vamos criar novas conexões hoje?"
        action={
          <span className="flex items-center gap-2 text-xs text-slate-500">
            <CalendarDays size={16} />
            12 de setembro de 2026
          </span>
        }
      />
      <section className="mb-7 grid gap-4 sm:grid-cols-3">
        {[
          {
            label: 'Turmas ativas',
            value: classrooms.filter((item) => !item.archived).length,
            icon: BookOpen,
            color: 'bg-blue-50 text-primary',
          },
          {
            label: 'Alunos conectados',
            value: students.filter((item) => item.classroomIds.length).length,
            icon: Users,
            color: 'bg-violet-50 text-violet-600',
          },
          {
            label: 'Aulas realizadas',
            value: lessons.filter((item) => item.status === 'finished').length,
            icon: Video,
            color: 'bg-teal-50 text-teal-600',
          },
        ].map(({ label, value, icon: Icon, color }) => (
          <article key={label} className="t-card flex items-center gap-4 p-5">
            <span className={`rounded-xl p-3 ${color}`}>
              <Icon size={23} />
            </span>
            <section>
              <p className="text-3xl font-bold">{value.toString().padStart(2, '0')}</p>
              <p className="mt-1 text-xs text-slate-500">{label}</p>
            </section>
          </article>
        ))}
      </section>
      {live && (
        <section className="mb-8 flex flex-wrap items-center justify-between gap-5 rounded-2xl border border-blue-200 bg-blue-50 p-6">
          <section className="flex items-center gap-4">
            <span className="hidden rounded-xl bg-white p-4 text-primary sm:block">
              <Video size={26} />
            </span>
            <section>
              <span className="t-badge mb-2">● Aula em andamento</span>
              <h2 className="font-ui text-lg font-bold">{live.title}</h2>
              <p className="mt-1 text-xs text-slate-500">
                {classrooms.find((item) => item.id === live.classroomId)?.name} · Sua sala está
                esperando por você
              </p>
            </section>
          </section>
          <button className="t-btn" onClick={() => openLesson(live.id)}>
            Retomar aula
            <ArrowRight size={16} />
          </button>
        </section>
      )}
      <section className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <section>
          <h2 className="font-ui text-lg font-bold">Suas turmas</h2>
          <p className="mt-1 text-xs text-slate-500">
            Conhecimento compartilhado, possibilidades ampliadas.
          </p>
        </section>
        <section className="flex gap-2">
          <button className="t-btn-secondary" onClick={() => editClassroom()}>
            <Plus size={16} />
            Criar turma
          </button>
          <button className="t-btn" onClick={() => startLesson()}>
            <Video size={16} />
            Iniciar aula
          </button>
        </section>
      </section>
      <section className="mb-3 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {classrooms
          .filter((item) => !item.archived)
          .slice(0, 3)
          .map((item) => (
            <ClassroomCard key={item.id} classroom={item} />
          ))}
      </section>
      <button
        onClick={() => onNavigate('Minhas turmas')}
        className="mb-8 mt-3 flex items-center gap-2 text-xs font-bold text-primary"
      >
        Ver todas as turmas
        <ArrowRight size={14} />
      </button>
      <section className="grid gap-6 xl:grid-cols-[1fr_300px]">
        <section>
          <h2 className="mb-4 font-ui text-lg font-bold">Aulas recentes</h2>
          <LessonList lessons={lessons.filter((item) => item.status === 'finished').slice(0, 3)} />
        </section>
        <aside className="rounded-2xl bg-background-dark p-6 text-white">
          <Hand className="mb-5 text-blue-300" size={30} />
          <p className="text-[10px] uppercase tracking-widest text-blue-300">
            Um sinal de cada vez
          </p>
          <h2 className="my-3 font-ui text-xl font-bold">A inclusão também se aprende.</h2>
          <p className="mb-6 text-sm leading-relaxed text-blue-100/60">
            Explore o alfabeto em Libras e aproxime-se de novas formas de comunicar.
          </p>
          <button
            onClick={() => onNavigate('Aprender Libras')}
            className="flex items-center gap-2 text-sm font-bold text-blue-200"
          >
            Conhecer o alfabeto
            <ArrowRight size={16} />
          </button>
        </aside>
      </section>
    </>
  )
}
