import { useEffect, useState } from 'react'
import { Clock, Hand, Mic, MicOff, Pause, Play, Square } from 'lucide-react'
import { Modal, PageTitle } from '../../../components/ui'
import { useTeacher } from '../../../contexts/TeacherContext'
import { transcript } from '../../../data/teacherDemo'
import type { Lesson } from '../../../types/education'
export default function LiveLesson({ lesson }: { lesson: Lesson }) {
  const { classrooms, lessons, setLessons, notify } = useTeacher()
  const [running, setRunning] = useState(true)
  const [seconds, setSeconds] = useState(() => (Number.parseInt(lesson.duration, 10) || 0) * 60)
  const [size, setSize] = useState(24)
  const [contrast, setContrast] = useState(false)
  const [speed, setSpeed] = useState('1')
  const [confirm, setConfirm] = useState(false)
  useEffect(() => {
    if (!running) return
    const timer = window.setInterval(() => setSeconds((value) => value + 1), 1000)
    return () => window.clearInterval(timer)
  }, [running])
  return (
    <>
      <PageTitle
        eyebrow={classrooms.find((item) => item.id === lesson.classroomId)?.name}
        title={lesson.title}
        description="Ambiente de aula · simulação visual"
        action={<span className="t-badge">● {running ? 'Aula em andamento' : 'Aula pausada'}</span>}
      />
      <section className="t-card mb-5 flex flex-wrap items-center justify-between gap-4 p-4">
        <span className="flex items-center gap-3 font-mono text-xl">
          <Clock size={20} />
          {Math.floor(seconds / 60)
            .toString()
            .padStart(2, '0')}
          :{(seconds % 60).toString().padStart(2, '0')}
        </span>
        <span className="flex items-center gap-2 text-sm text-slate-500">
          {running ? <Mic size={18} className="text-emerald-600" /> : <MicOff size={18} />}Microfone{' '}
          {running ? 'ativo' : 'pausado'} (simulado)
        </span>
        <section className="flex flex-wrap gap-2">
          <button className="t-btn-secondary" disabled={running} onClick={() => setRunning(true)}>
            <Play size={16} />
            Iniciar
          </button>
          <button className="t-btn-secondary" disabled={!running} onClick={() => setRunning(false)}>
            <Pause size={16} />
            Pausar
          </button>
          <button className="t-btn-danger" onClick={() => setConfirm(true)}>
            <Square size={15} />
            Finalizar
          </button>
        </section>
      </section>
      <section className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <article
          className={`min-h-96 rounded-2xl border p-6 ${contrast ? 'border-black bg-black text-white' : 'border-slate-200 bg-white'}`}
        >
          <header className="mb-8 flex justify-between text-xs font-semibold uppercase tracking-wider">
            <span>Transcrição da aula</span>
            <span className="text-primary">Texto fictício</span>
          </header>
          <p className="leading-[1.9]" style={{ fontSize: size }}>
            {transcript}
          </p>
          <p className="mt-8 text-xs opacity-50">
            {running ? 'Demonstração em reprodução' : 'Demonstração pausada'}
          </p>
        </article>
        <article className="t-card flex min-h-96 flex-col items-center justify-center p-8 text-center">
          <span className="mb-5 rounded-full bg-blue-50 p-9 text-primary">
            <Hand size={72} strokeWidth={1} />
          </span>
          <h2 className="font-ui text-xl font-bold">Avatar de Libras</h2>
          <p className="mt-3 max-w-64 text-sm leading-relaxed text-slate-500">
            Espaço reservado para o avatar. Nenhuma tradução ou sinal é exibido nesta demonstração.
          </p>
          <span className="t-badge-neutral mt-6">Velocidade visual: {speed}×</span>
        </article>
      </section>
      <section className="t-card mt-5 flex flex-wrap items-center gap-6 p-5">
        <label className="text-sm">
          Tamanho do texto{' '}
          <input
            className="ml-3 align-middle"
            type="range"
            min="18"
            max="36"
            value={size}
            onChange={(event) => setSize(Number(event.target.value))}
          />
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={contrast}
            onChange={(event) => setContrast(event.target.checked)}
          />
          Alto contraste
        </label>
        <label className="text-sm">
          Velocidade do avatar{' '}
          <select
            className="t-input ml-2 w-auto"
            value={speed}
            onChange={(event) => setSpeed(event.target.value)}
          >
            <option value="0.5">0,5×</option>
            <option value="1">1×</option>
            <option value="1.5">1,5×</option>
          </select>
        </label>
      </section>
      {confirm && (
        <Modal title="Finalizar esta aula?" onClose={() => setConfirm(false)}>
          <p className="mb-6 text-sm text-slate-500">
            A aula será marcada como finalizada nesta demonstração. Você poderá consultar a
            transcrição e o resumo.
          </p>
          <section className="flex justify-end gap-3">
            <button className="t-btn-secondary" onClick={() => setConfirm(false)}>
              Continuar aula
            </button>
            <button
              className="t-btn-danger"
              onClick={() => {
                setLessons(
                  lessons.map((item) =>
                    item.id === lesson.id
                      ? { ...item, status: 'finished', duration: `${Math.floor(seconds / 60)} min` }
                      : item,
                  ),
                )
                notify('Aula finalizada. Conteúdo disponível para revisão.')
              }}
            >
              Finalizar aula
            </button>
          </section>
        </Modal>
      )}
    </>
  )
}
