import { Mic, FileText, Cpu, Hand } from 'lucide-react'
const steps = [
  {
    icon: Mic,
    title: 'Você fala',
    text: 'O sistema captura o áudio utilizando o microfone do dispositivo.',
  },
  {
    icon: FileText,
    title: 'A fala é processada',
    text: 'Tecnologias de reconhecimento de voz transformam o áudio em texto.',
  },
  {
    icon: Cpu,
    title: 'A informação é processada',
    text: 'O sistema prepara o conteúdo para sua representação em Libras.',
  },
  {
    icon: Hand,
    title: 'O conteúdo é apresentado',
    text: 'O resultado é apresentado por meio de recursos visuais e avatar em Libras.',
  },
]
export default function Funcionamento() {
  return (
    <section id="funcionamento" className="edu-section" aria-labelledby="funcionamento-title">
      <div className="edu-container">
        <div className="edu-section-heading">
          <span className="edu-eyebrow">Como Funciona</span>
          <h2 id="funcionamento-title">Comunicação em tempo real, de forma simples.</h2>
        </div>
        <ol className="edu-three-columns edu-steps edu-four-steps">
          {steps.map(({ icon: Icon, title, text }, index) => (
            <li key={title}>
              <span className="edu-step-number">0{index + 1}</span>
              <Icon size={28} aria-hidden="true" />
              <h3>{title}</h3>
              <p>{text}</p>
            </li>
          ))}
        </ol>
        <p className="edu-content-note">
          Tudo isso acontece por meio de uma arquitetura desenvolvida para processamento em tempo
          real.
        </p>
      </div>
    </section>
  )
}
