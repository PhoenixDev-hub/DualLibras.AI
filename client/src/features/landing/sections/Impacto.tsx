import { HeartHandshake, Cpu, FlaskConical } from 'lucide-react'
const values = [
  {
    icon: HeartHandshake,
    title: 'Inclusão',
    text: 'Desenvolver tecnologia pensando em experiências mais acessíveis para pessoas surdas.',
  },
  {
    icon: Cpu,
    title: 'Tecnologia',
    text: 'Integrar reconhecimento de voz, processamento de dados e representação em Libras em uma única experiência.',
  },
  {
    icon: FlaskConical,
    title: 'Pesquisa e desenvolvimento',
    text: 'Testar, avaliar e aprimorar continuamente a solução a partir dos resultados obtidos.',
  },
]
export default function Impacto() {
  return (
    <section id="impacto" className="edu-section edu-about" aria-labelledby="impacto-title">
      <div className="edu-container">
        <div className="edu-section-heading">
          <span className="edu-eyebrow">Sobre o Projeto</span>
          <h2 id="impacto-title">Tecnologia a favor da inclusão.</h2>
          <p>
            O DualLibras.ai é um projeto que busca explorar como tecnologias de inteligência
            artificial podem contribuir para uma comunicação mais acessível em Libras.
          </p>
          <p>
            A proposta combina reconhecimento de voz, processamento de linguagem e recursos de
            representação em Libras para criar uma experiência de comunicação em tempo real.
          </p>
          <p>
            Atualmente, o projeto encontra-se em fase de protótipo e testes. Esta etapa é
            fundamental para avaliar a experiência de uso, identificar limitações e aprimorar a
            tecnologia.
          </p>
        </div>
        <div className="edu-three-columns">
          {values.map(({ icon: Icon, title, text }) => (
            <article className="edu-value" key={title}>
              <span className="edu-icon">
                <Icon size={25} aria-hidden="true" />
              </span>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
