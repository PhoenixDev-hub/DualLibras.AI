import { useContext } from 'react'
import { Clock, Video } from 'lucide-react'
import { Empty } from '../../../components/ui'
import { TeacherContext } from '../../../contexts/TeacherContext'
import type { Classroom, Lesson } from '../../../types/education'

function formatLessonDate(dateStr: string) {
  if (!dateStr) return ''
  const parsed = new Date(dateStr)
  if (!isNaN(parsed.getTime()) && (dateStr.includes('T') || dateStr.includes('-'))) {
    return parsed.toLocaleDateString('pt-BR')
  }
  return dateStr
}

export default function LessonList({
  lessons,
  classrooms: customClassrooms,
  onOpenLesson,
  emptyText = 'Esta turma ainda não tem aulas. Inicie seu primeiro encontro.',
}: {
  lessons: Lesson[]
  classrooms?: Classroom[]
  onOpenLesson?: (id: string | number) => void
  emptyText?: string
}) {
  const teacher = useContext(TeacherContext)
  const classrooms = customClassrooms ?? teacher?.classrooms ?? []
  const handleOpen = onOpenLesson ?? teacher?.openLesson

  return lessons.length ? (
    <section className="t-card divide-y divide-slate-100">
      {lessons.map((lesson) => (
        <button
          key={lesson.id}
          type="button"
          onClick={() => handleOpen?.(lesson.id)}
          className="flex w-full flex-wrap items-center gap-4 p-5 text-left transition hover:bg-blue-50/50"
        >
          <span className="rounded-xl bg-blue-50 p-3 text-primary">
            <Video size={18} />
          </span>
          <section className="min-w-40 flex-1">
            <h3 className="text-sm font-semibold">{lesson.title}</h3>
            <p className="mt-1 text-xs text-slate-500">
              {classrooms.find((item) => String(item.id) === String(lesson.classroomId))?.name ||
                'Turma'}{' '}
              · {formatLessonDate(lesson.date)}
            </p>
          </section>
          <span className="flex items-center gap-1 text-xs text-slate-500">
            <Clock size={13} />
            {lesson.duration}
          </span>
          <span className={lesson.status === 'live' ? 't-badge' : 't-badge-neutral'}>
            {
              {
                live: 'Em andamento',
                finished: 'Finalizada',
                scheduled: 'Agendada',
                cancelled: 'Cancelada',
              }[lesson.status]
            }
          </span>
        </button>
      ))}
    </section>
  ) : (
    <Empty text={emptyText} />
  )
}
