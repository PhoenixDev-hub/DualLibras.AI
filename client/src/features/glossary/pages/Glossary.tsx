import type { FormEvent } from 'react'
import { useState } from 'react'
import { BookOpen, Plus } from 'lucide-react'
import { Empty, Modal, PageTitle, SearchInput } from '../../../components/ui'
import { useTeacher } from '../../../contexts/TeacherContext'
export default function Glossary() {
  const { terms, notify } = useTeacher()
  const [query, setQuery] = useState('')
  const [subject, setSubject] = useState('')
  const [adding, setAdding] = useState(false)
  const filtered = terms.filter(
    (item) =>
      item.term.toLowerCase().includes(query.toLowerCase()) &&
      (!subject || item.subject === subject),
  )
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    notify('A criação de termos ainda não está disponível.')
  }

  return (
    <>
      <PageTitle
        title="Glossário"
        description="Palavras que abrem caminhos para o conhecimento."
        action={
          <button
            className="t-btn"
            disabled
            title="Criação de termos ainda indisponível"
            onClick={() => setAdding(true)}
          >
            <Plus size={16} />
            Adicionar termo
          </button>
        }
      />
      <section className="mb-6 flex flex-wrap gap-3">
        <SearchInput value={query} onChange={setQuery} placeholder="Buscar termo" />
        <select
          className="t-input w-auto"
          aria-label="Filtrar disciplina"
          value={subject}
          onChange={(event) => setSubject(event.target.value)}
        >
          <option value="">Todas as disciplinas</option>
          {[...new Set(terms.map((item) => item.subject))].map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
      </section>
      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((item) => (
          <article key={item.id} className="t-card p-6">
            <BookOpen size={23} className="mb-5 text-primary dark:text-blue-300" />
            <span className="text-xs text-primary dark:text-blue-300">{item.subject}</span>
            <h2 className="my-3 font-ui text-xl font-bold">{item.term}</h2>
            <p className="text-sm leading-6 text-slate-500 dark:text-slate-400">
              {item.definition}
            </p>
            <p className="mt-5 rounded-lg bg-slate-50 dark:bg-slate-950 p-3 text-xs leading-5 text-slate-500 dark:text-slate-400">
              <strong>Exemplo:</strong> {item.example}
            </p>
          </article>
        ))}
      </section>
      {!filtered.length && <Empty text="Nenhum termo encontrado." />}
      {adding && (
        <Modal title="Adicionar termo" onClose={() => setAdding(false)}>
          <form className="space-y-4" onSubmit={handleSubmit}>
            {[
              { name: 'term', label: 'Termo' },
              { name: 'definition', label: 'Definição' },
              { name: 'subject', label: 'Disciplina' },
              { name: 'example', label: 'Exemplo de uso' },
            ].map((field) => (
              <label key={field.name} className="t-label">
                {field.label}
                <input className="t-input" name={field.name} required />
              </label>
            ))}
            <button className="t-btn">Salvar termo</button>
          </form>
        </Modal>
      )}
    </>
  )
}
