import Materials from '../../materials/pages/Materials'
import { PageTitle } from '../../../components/ui'
import type { Lesson } from '../../../types/education'
export default function LessonDetails({ lesson }: { lesson: Lesson }) {
  return (
    <>
      <PageTitle
        title={lesson.title}
        description={`${new Date(lesson.date).toLocaleDateString('pt-BR')} · ${lesson.duration}`}
      />
      <article className="t-card mb-5 p-7">
        <h2 className="mb-4 font-bold">Transcrição salva</h2>
        <p className="whitespace-pre-wrap">
          {lesson.transcript || 'Nenhuma transcrição salva para esta aula.'}
        </p>
      </article>
      <article className="t-card p-7">
        <h2 className="mb-4 font-bold">Resumo</h2>
        <p className="whitespace-pre-wrap">{lesson.summary || 'Nenhum resumo cadastrado.'}</p>
      </article>
      <section className="mt-7">
        <Materials classroomId={lesson.classroomId} lessonId={lesson.id} />
      </section>
    </>
  )
}
