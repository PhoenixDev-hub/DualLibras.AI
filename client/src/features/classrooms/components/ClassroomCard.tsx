import { useState } from 'react'
import { ArrowUpRight, BookOpen, Copy, MoreHorizontal, Users } from 'lucide-react'
import { useTeacher } from '../../../contexts/TeacherContext'
import type { Classroom } from '../../../types/education'
export default function ClassroomCard({ classroom }: { classroom: Classroom }) {
  const {
    students,
    lessons,
    openClassroom,
    editClassroom,
    copy,
    setClassrooms,
    classrooms,
    notify,
  } = useTeacher()
  const [menu, setMenu] = useState(false)
  return (
    <article className="t-card overflow-hidden">
      <header className={`class-banner banner-${classroom.color} relative h-32 p-5 text-white`}>
        <BookOpen className="absolute bottom-3 right-5 h-20 w-20 -rotate-12 opacity-10" />
        <p className="text-[10px] font-bold uppercase tracking-widest text-white/70">
          {classroom.subject}
        </p>
        <button
          onClick={() => openClassroom(classroom.id)}
          className="mt-3 text-left font-ui text-xl font-bold hover:underline"
        >
          {classroom.name}
        </button>
        <button
          aria-label={`Opções de ${classroom.name}`}
          aria-expanded={menu}
          className="absolute right-3 top-2 rounded-lg p-2 hover:bg-white/20"
          onClick={() => setMenu(!menu)}
        >
          <MoreHorizontal size={19} />
        </button>
        {menu && (
          <section className="absolute right-3 top-12 z-10 grid w-40 rounded-xl border border-slate-200 bg-white p-1 text-sm text-slate-700 shadow-xl">
            <button
              className="rounded-lg p-3 text-left hover:bg-slate-50"
              onClick={() => {
                editClassroom(classroom)
                setMenu(false)
              }}
            >
              Editar turma
            </button>
            <button
              className="rounded-lg p-3 text-left hover:bg-slate-50"
              onClick={() => {
                setClassrooms(
                  classrooms.map((item) =>
                    item.id === classroom.id ? { ...item, archived: !item.archived } : item,
                  ),
                )
                notify(classroom.archived ? 'Turma reativada.' : 'Turma arquivada.')
                setMenu(false)
              }}
            >
              {classroom.archived ? 'Reativar' : 'Arquivar'}
            </button>
          </section>
        )}
      </header>
      <section className="p-5">
        <p className="flex items-center gap-2 text-xs text-slate-500">
          <Users size={15} />
          {
            students.filter((student) => student.classroomIds.includes(classroom.id)).length
          } alunos <span className="ml-auto">2026 · 2º semestre</span>
        </p>
        <section className="my-5 min-h-6">
          {lessons.some(
            (lesson) => lesson.classroomId === classroom.id && lesson.status === 'live',
          ) ? (
            <span className="t-badge">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Aula em andamento
            </span>
          ) : (
            <span className="text-xs text-slate-400">Seu próximo encontro começa aqui</span>
          )}
        </section>
        <footer className="flex items-center justify-between border-t border-slate-100 pt-4">
          <button
            className="flex items-center gap-2 text-xs text-slate-500"
            onClick={() => copy(classroom.code)}
            aria-label={`Copiar código ${classroom.code}`}
          >
            {classroom.code}
            <Copy size={13} />
          </button>
          <button
            onClick={() => openClassroom(classroom.id)}
            className="flex items-center gap-1 text-xs font-bold text-primary"
          >
            Abrir turma
            <ArrowUpRight size={15} />
          </button>
        </footer>
      </section>
    </article>
  )
}
