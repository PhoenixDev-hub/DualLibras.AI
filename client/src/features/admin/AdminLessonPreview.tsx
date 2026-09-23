import { useAutoRefresh } from '../../hooks/useAutoRefresh'
import { useEffect, useState } from 'react'
import { Modal } from '../../components/ui'
import { adminApi, lessonLabels } from './adminApi'
export default function AdminLessonPreview({ id, onClose }: { id: string; onClose: () => void }) {
  const [lesson, setLesson] = useState<Awaited<ReturnType<typeof adminApi.lessonDetail>> | null>(
    null,
  )
  const [error, setError] = useState('')
  useAutoRefresh(
    async (isCurrent) => {
      const next = await adminApi.lessonDetail(id)
      if (!isCurrent()) return
      setLesson((current) => (JSON.stringify(current) === JSON.stringify(next) ? current : next))
      setError('')
    },
    { scope: id, interval: lesson?.status === 'EM_ANDAMENTO' ? 5000 : 15000 },
  )
  useEffect(() => {
    let active = true
    adminApi
      .lessonDetail(id)
      .then((data) => {
        if (active) setLesson(data)
      })
      .catch((err) => {
        if (active) setError(err.message)
      })
    return () => {
      active = false
    }
  }, [id])
  return (
    <Modal title={lesson?.title ?? 'Detalhes da aula'} onClose={onClose}>
      {error ? (
        <p role="alert" className="text-red-700 dark:text-red-300">
          {error}
        </p>
      ) : !lesson ? (
        <p role="status">Carregando aula…</p>
      ) : (
        <div className="space-y-5">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {lesson.classroom.name} · {lesson.teacher.name} · {lessonLabels[lesson.status]}
          </p>
          <section>
            <h3 className="mb-3 font-semibold">Resumo</h3>
            <p className="whitespace-pre-wrap text-sm leading-relaxed">
              {lesson.summary?.content || 'Nenhum resumo disponível.'}
            </p>
          </section>
          <section>
            <h3 className="mb-3 font-semibold">Transcrição</h3>
            <p className="whitespace-pre-wrap text-sm leading-relaxed">
              {lesson.transcriptionSessions
                .map((session) => session.transcript)
                .filter(Boolean)
                .join('\n\n') || 'Nenhuma transcrição disponível.'}
            </p>
          </section>
        </div>
      )}
    </Modal>
  )
}
