import { ArrowRight, Layers, Rocket, Target, type LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useInView } from '../../hooks/useInView';

interface PillarItem {
  icon: LucideIcon;
  title: string;
  description: string;
}

const pillars: PillarItem[] = [
  {
    icon: Target,
    title: 'Objetivo de Inclusão',
    description: 'Proporcionar uma experiência de aprendizado mais inclusiva e autônoma para alunos surdos.',
  },
  {
    icon: Layers,
    title: 'Arquitetura de Testes',
    description: 'Integração entre reconhecimento de áudio, geração de legendas e renderização em Libras.',
  },
  {
    icon: Rocket,
    title: 'Fase de Protótipo',
    description: 'Plataforma disponibilizada para validação experimental de usabilidade e interface.',
  },
];

export default function Impacto() {
  const [headerRef, headerInView] = useInView<HTMLDivElement>();
  const [pillarsRef, pillarsInView] = useInView<HTMLDivElement>({ threshold: 0.1 });
  const [ctaRef, ctaInView] = useInView<HTMLDivElement>();

  return (
    <section id="impacto" className="relative bg-background-dark px-4 py-24 overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

      <div className="max-w-5xl mx-auto text-center">
        <div
          ref={headerRef}
          className={`transition-all duration-700 ease-out ${
            headerInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
          }`}
        >
          <span className="inline-flex items-center gap-2 mb-6 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary font-logo text-xs uppercase tracking-[0.2em]">
            Sobre o Projeto
          </span>

          <h2 className="font-ui font-extrabold tracking-tight leading-tight text-text-light text-3xl md:text-4xl lg:text-5xl">
            Apresentação do <span className="text-primary">Protótipo.</span>
          </h2>

          <p className="mt-6 max-w-2xl mx-auto text-base md:text-lg text-gray-mid leading-relaxed font-text">
            Este projeto está em sua fase inicial de desenvolvimento e testes. Nossa meta é demonstrar a viabilidade da tradução em tempo real para acessibilidade em Libras.
          </p>
        </div>

        {/* Pilares do projeto em vez de estatísticas numéricas */}
        <div ref={pillarsRef} className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
          {pillars.map(({ icon: Icon, title, description }, index) => (
            <div
              key={title}
              style={{ transitionDelay: pillarsInView ? `${index * 120}ms` : '0ms' }}
              className={`text-left p-8 rounded-2xl border border-primary/10 bg-secondary/10 hover:border-primary/30 hover:-translate-y-1 transition-all duration-700 ease-out ${
                pillarsInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
            >
              <div className="mb-5 w-12 h-12 flex items-center justify-center rounded-full bg-primary/10 text-primary">
                <Icon size={24} strokeWidth={1.75} aria-hidden="true" />
              </div>
              <h3 className="font-ui font-semibold text-text-light text-lg mb-2">{title}</h3>
              <p className="text-sm text-gray-mid font-text leading-relaxed">{description}</p>
            </div>
          ))}
        </div>

        {/* CTA final direcionando para o protótipo */}
        <div
          ref={ctaRef}
          className={`mt-20 relative overflow-hidden rounded-3xl px-8 py-14 md:py-16 bg-gradient-to-br from-primary to-secondary transition-all duration-700 ease-out ${
            ctaInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <h3 className="font-ui font-extrabold text-text-light text-2xl md:text-3xl">
            Pronto para testar a aplicação?
          </h3>
          <p className="mt-3 text-text-light/80 font-text max-w-xl mx-auto">
            Experimente o protótipo funcional diretamente pelo navegador.
          </p>
          <Link
            to="/app"
            className="mt-8 inline-flex items-center gap-2 px-7 py-3.5 bg-background-dark text-text-light font-ui font-semibold tracking-wide rounded-full hover:scale-[1.03] transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text-light focus-visible:ring-offset-2 focus-visible:ring-offset-primary"
          >
            Acessar Protótipo
            <ArrowRight size={18} strokeWidth={2} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}
