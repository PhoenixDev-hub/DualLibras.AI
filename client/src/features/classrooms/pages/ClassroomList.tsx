import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Empty, PageTitle, SearchInput } from '../../../components/ui'
import { useTeacher } from '../../../contexts/TeacherContext'
import ClassroomCard from '../components/ClassroomCard'
export default function ClassroomList({ initialQuery = '' }: { initialQuery?: string }) {
  const { classrooms, editClassroom } = useTeacher()
  const [query, setQuery] = useState(initialQuery)
  const [filter, setFilter] = useState('active')
  const filtered = classrooms.filter(
    (item) =>
      item.archived === (filter === 'archived') &&
      `${item.name} ${item.subject}`
        .toLocaleLowerCase('pt-BR')
        .includes(query.toLocaleLowerCase('pt-BR')),
  )
  return (
    <>
      <PageTitle
        eyebrow="Conecte sua sala"
        title="Minhas turmas"
        description="Cada turma, um novo espaço para aprender juntos."
        action={
          <button className="t-btn" onClick={() => editClassroom()}>
            <Plus size={17} />
            Criar turma
          </button>
        }
      />
      <section className="mb-6 flex flex-wrap justify-between gap-3">
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="Buscar por turma ou disciplina"
        />
        <select
          className="t-input w-auto"
          aria-label="Filtrar turmas"
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
        >
          <option value="active">Turmas ativas</option>
          <option value="archived">Turmas arquivadas</option>
        </select>
      </section>
      {filtered.length ? (
        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((item) => (
            <ClassroomCard key={item.id} classroom={item} />
          ))}
        </section>
      ) : (
        <Empty text="Nenhuma turma encontrada. Crie uma turma ou ajuste sua busca." />
      )}
    </>
  )
}
