import { Clock, Video } from 'lucide-react'
import { Empty } from '../../../components/ui'
import { useTeacher } from '../../../contexts/TeacherContext'
import type { Lesson } from '../../../types/education'
export default function LessonList({ lessons }: { lessons: Lesson[] }) {
  const { classrooms, openLesson } = useTeacher()
  return lessons.length ? (
    <section className="t-card divide-y divide-slate-100">
      {lessons.map((lesson) => (
        <button
          key={lesson.id}
          onClick={() => openLesson(lesson.id)}
          className="flex w-full flex-wrap items-center gap-4 p-5 text-left hover:bg-blue-50/50"
        >
          <span className="rounded-xl bg-blue-50 p-3 text-primary">
            <Video size={18} />
          </span>
          <section className="min-w-40 flex-1">
            <h3 className="text-sm font-semibold">{lesson.title}</h3>
            <p className="mt-1 text-xs text-slate-500">
              {classrooms.find((item) => item.id === lesson.classroomId)?.name} · {lesson.date}
            </p>
          </section>
          <span className="flex items-center gap-1 text-xs text-slate-500">
            <Clock size={13} />
            {lesson.duration}
          </span>
          <span className={lesson.status === 'live' ? 't-badge' : 't-badge-neutral'}>
            {lesson.status === 'live' ? 'Em andamento' : 'Finalizada'}
          </span>
        </button>
      ))}
    </section>
  ) : (
    <Empty text="Esta turma ainda não tem aulas. Inicie seu primeiro encontro." />
  )
}
