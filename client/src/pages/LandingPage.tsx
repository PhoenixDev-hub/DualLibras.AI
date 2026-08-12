import { useEffect } from 'react';
import Footer from '../components/landing/Footer';
import Funcionamento from '../components/landing/Funcionamento';
import Header from '../components/landing/Header';
import Hero from '../components/landing/Hero';
import Impacto from '../components/landing/Impacto';
import Problema from '../components/landing/Problema';
import Tecnologias from '../components/landing/tecnologia';

export default function LandingPage() {
  useEffect(() => {
    // Desativa a restauração automática de scroll do navegador ao recarregar
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }

    // Se houver hash na URL no recarregamento, limpa para evitar rolagem automática
    if (window.location.hash) {
      window.history.replaceState(null, '', window.location.pathname);
    }

    // Força o scroll para o topo da Landing Page
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <Hero />
        <Problema />
        <Funcionamento />
        <Tecnologias />
        <Impacto />
        <Footer />
      </main>
    </div>
  );
}
