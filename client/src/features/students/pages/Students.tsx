import { authApi } from '../../../services/authApi'
import { useState } from 'react'
import { Copy, Trash2 } from 'lucide-react'
import { Empty, Modal, PageTitle, SearchInput } from '../../../components/ui'
import { useTeacher } from '../../../contexts/TeacherContext'
import { initials } from '../../../utils/initials'
import type { Student } from '../../../types/education'
export default function Students({ classroomId }: { classroomId?: string | number }) {
  const { user: teacher, students, refresh, classrooms, copy, notify } = useTeacher()
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('')
  const [selected, setSelected] = useState<Student | null>(null)
  const [removing, setRemoving] = useState<Student | null>(null)
  const room = classrooms.find((item) => item.id === classroomId)
  const filtered = students.filter(
    (student) =>
      student.classroomIds.length &&
      student.name.toLowerCase().includes(query.toLowerCase()) &&
      (!(classroomId || filter) || student.classroomIds.includes(classroomId ?? filter)),
  )
  return (
    <>
      <PageTitle
        title={classroomId ? 'Pessoas' : 'Meus alunos'}
        description="Pessoas que fazem parte das suas conexões."
        action={
          room && (
            <button
              className="t-btn-secondary"
              onClick={() =>
                copy(`Entre na turma ${room.name} no DualLibras.AI com o código ${room.code}.`)
              }
            >
              <Copy size={16} />
              Copiar convite
            </button>
          )
        }
      />
      {classroomId && (
        <section className="t-card mb-6 flex items-center gap-4 p-5">
          <span className="t-avatar">MO</span>
          <section>
            <h3 className="text-sm font-bold">{room?.teacherName ?? teacher?.name}</h3>
            <p className="text-xs text-slate-500">Professor responsável</p>
          </section>
        </section>
      )}
      <section className="mb-5 flex flex-wrap gap-3">
        <SearchInput value={query} onChange={setQuery} placeholder="Buscar aluno por nome" />
        {!classroomId && (
          <select
            className="t-input w-auto"
            aria-label="Filtrar por turma"
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
          >
            <option value="">Todas as turmas</option>
            {classrooms.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        )}
      </section>
      {filtered.length ? (
        <section className="t-card divide-y divide-slate-100">
          {filtered.map((student) => (
            <article key={student.id} className="flex items-center gap-3 p-4">
              <button
                onClick={() => setSelected(student)}
                className="flex flex-1 items-center gap-4 text-left"
              >
                <span className="t-avatar">{initials(student.name)}</span>
                <section>
                  <h3 className="text-sm font-semibold">{student.name}</h3>
                  <p className="mt-1 text-xs text-slate-500">
                    {classroomId
                      ? `Entrou em ${student.joined}`
                      : classrooms
                          .filter((item) => student.classroomIds.includes(item.id))
                          .map((item) => item.name)
                          .join(' · ')}
                  </p>
                </section>
              </button>
              {classroomId && (teacher?.role === 'PROFESSOR' || teacher?.role === 'ADMIN') && (
                <button
                  className="t-icon text-red-500"
                  aria-label={`Remover ${student.name} da turma`}
                  onClick={() => setRemoving(student)}
                >
                  <Trash2 size={17} />
                </button>
              )}
            </article>
          ))}
        </section>
      ) : (
        <Empty text="Nenhum aluno encontrado. Compartilhe o código da turma ou ajuste sua busca." />
      )}
      {selected && (
        <Modal title="Informações do aluno" onClose={() => setSelected(null)}>
          <section className="flex items-center gap-4">
            <span className="t-avatar">{initials(selected.name)}</span>
            <h3 className="font-bold">{selected.name}</h3>
          </section>
          <p className="my-5 text-sm text-slate-500">Participa desde {selected.joined}</p>
          <h4 className="mb-3 text-sm font-bold">Turmas em comum</h4>
          {classrooms
            .filter((item) => selected.classroomIds.includes(item.id))
            .map((item) => (
              <p className="mb-2 rounded-lg bg-blue-50 p-3 text-sm" key={item.id}>
                {item.name} · {item.subject}
              </p>
            ))}
        </Modal>
      )}
      {removing && (
        <Modal title="Remover aluno da turma?" onClose={() => setRemoving(null)}>
          <p className="mb-6 text-sm text-slate-500">
            {removing.name} será removido apenas desta turma.
          </p>
          <section className="flex justify-end gap-3">
            <button className="t-btn-secondary" onClick={() => setRemoving(null)}>
              Cancelar
            </button>
            <button
              className="t-btn-danger"
              onClick={async () => {
                if (!classroomId) return
                try {
                  await authApi.removeMember(classroomId, removing.id)
                  await refresh()
                  setRemoving(null)
                  notify('Aluno removido da turma.')
                } catch (err) {
                  notify(err instanceof Error ? err.message : 'Não foi possível remover.')
                }
              }}
            >
              Remover aluno
            </button>
          </section>
        </Modal>
      )}
    </>
  )
}
