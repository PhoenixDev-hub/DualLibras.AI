import ProjectLogo from '../../../components/brand/ProjectLogo'
import { Link } from 'react-router-dom'
export default function Footer() {
  return (
    <footer className="edu-footer">
      <div className="edu-container edu-footer-inner">
        <div>
          <Link to="/" className="edu-brand">
            <ProjectLogo />
          </Link>
          <p>Tecnologia para aproximar pessoas, voz e Libras.</p>
        </div>
        <nav aria-label="Navegação do rodapé">
          <a href="#funcionamento">Como funciona</a>
          <a href="#dicionario">Dicionário</a>
          <a href="#impacto">Sobre o projeto</a>
          <a href="#limitacoes">Limitações</a>
        </nav>
      </div>
      <div className="edu-container edu-footer-bottom">
        <span>© {new Date().getFullYear()} DualLibras.ai</span>
        <span>O DualLibras.ai está em fase de protótipo e testes.</span>
      </div>
    </footer>
  )
}
