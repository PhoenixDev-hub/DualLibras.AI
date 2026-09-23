import { ArrowDown, ArrowRight, BookOpen, FileText, Hand, Mic } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function Hero() {
  return (
    <section id="inicio" className="edu-hero edu-container">
      <div className="edu-hero-copy">
        <span className="edu-eyebrow">
          <BookOpen size={17} aria-hidden="true" /> Início
        </span>
        <h1>
          Voz que vira informação. <span>Informação que chega em Libras.</span>
        </h1>
        <p>
          O DualLibras.ai utiliza inteligência artificial para transformar fala em texto e apoiar
          sua representação em Libras em tempo real.
        </p>
        <div className="edu-actions">
          <Link className="edu-button" to="/demonstracao">
            Testar protótipo <ArrowRight size={18} aria-hidden="true" />
          </Link>
          <a className="edu-button edu-button-outline" href="#impacto">
            Conheça o projeto
          </a>
        </div>
        <a className="edu-text-link" href="#dicionario">
          <Hand size={18} aria-hidden="true" /> Que tal praticar um pouco de Libras?
        </a>
      </div>
      <figure className="edu-notebook" aria-labelledby="activity-caption">
        <figcaption id="activity-caption">
          <span className="edu-notebook-dot" /> Da voz à Libras{' '}
          <span>Entenda a proposta do projeto</span>
        </figcaption>
        <div className="edu-notebook-page">
          <span className="edu-subject">Comunicação · Acessibilidade</span>
          <h2>Uma fala, novas formas de acesso.</h2>
          <div
            className="edu-cycle"
            aria-label="A voz é capturada, transformada em texto e preparada para sua representação em Libras"
          >
            <span>
              <Mic size={44} strokeWidth={1.5} aria-hidden="true" />
              <strong>Voz</strong>
            </span>
            <ArrowRight className="edu-cycle-arrow" size={22} aria-hidden="true" />
            <span>
              <FileText size={44} strokeWidth={1.5} aria-hidden="true" />
              <strong>Texto</strong>
            </span>
            <ArrowRight className="edu-cycle-arrow" size={22} aria-hidden="true" />
            <span>
              <Hand size={44} strokeWidth={1.5} aria-hidden="true" />
              <strong>Libras</strong>
            </span>
          </div>
          <blockquote>
            A fala vira texto. A informação ganha apoio visual com o avatar em Libras, aproximando
            diferentes formas de comunicação.
          </blockquote>
          <p className="edu-notebook-note">
            Uma proposta de apoio à acessibilidade, em fase de protótipo e testes.
          </p>
        </div>
        <aside className="edu-sticky-note">
          <Hand size={23} aria-hidden="true" />
          <span>
            Voz e Libras,
            <br />
            <strong>pessoas mais próximas.</strong>
          </span>
        </aside>
      </figure>
      <a href="#funcionamento" className="edu-hero-next">
        Como funciona <ArrowDown size={16} aria-hidden="true" />
      </a>
    </section>
  )
}
