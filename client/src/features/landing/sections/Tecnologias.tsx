import { Monitor, Server, Container } from 'lucide-react'
const technologies = [
  {
    icon: Monitor,
    title: 'Frontend',
    text: 'React, TypeScript, Vite, Tailwind CSS, WebRTC e VLibras.',
  },
  {
    icon: Server,
    title: 'Backend',
    text: 'Python, FastAPI, WebSockets, AssemblyAI e Faster Whisper.',
  },
  {
    icon: Container,
    title: 'Infraestrutura',
    text: 'Docker, Docker Compose e Nginx.',
  },
]
export default function Tecnologias() {
  return (
    <section id="tecnologias" className="edu-section" aria-labelledby="tecnologias-title">
      <div className="edu-container">
        <div className="edu-section-heading">
          <span className="edu-eyebrow">Tecnologias</span>
          <h2 id="tecnologias-title">Tecnologia por trás da experiência.</h2>
          <p>
            O DualLibras.ai combina tecnologias de desenvolvimento web, processamento de voz e
            inteligência artificial para construir uma experiência de comunicação acessível e com
            baixa latência.
          </p>
        </div>
        <div className="edu-three-columns edu-resources">
          {technologies.map(({ icon: Icon, title, text }) => (
            <article key={title}>
              <Icon size={29} aria-hidden="true" />
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
        <p className="edu-content-note">
          Cada tecnologia cumpre uma etapa específica do caminho entre a voz capturada e sua
          representação em Libras.
        </p>
      </div>
    </section>
  )
}
