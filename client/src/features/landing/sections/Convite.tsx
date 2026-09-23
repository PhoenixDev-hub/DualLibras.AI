import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function Convite() {
  return (
    <section id="experimentar" className="edu-section edu-practice" aria-labelledby="convite-title">
      <div className="edu-container">
        <div className="edu-section-heading">
          <h2 id="convite-title">Experimente o DualLibras.ai.</h2>
          <p>Experimente voz, texto e Libras por até 60 segundos, sem precisar criar uma conta.</p>
        </div>
        <div className="edu-actions">
          <Link to="/demonstracao" className="edu-button">
            Testar protótipo <ArrowRight size={18} aria-hidden="true" />
          </Link>
          <a href="#impacto" className="edu-button edu-button-outline">
            Conhecer o projeto
          </a>
        </div>
        <p className="edu-content-note">O DualLibras.ai está em fase de protótipo e testes.</p>
      </div>
    </section>
  )
}
