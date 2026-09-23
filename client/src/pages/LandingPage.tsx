import '../features/landing/landing.css'
import { useEffect } from 'react'
import Footer from '../features/landing/layout/Footer'
import Header from '../features/landing/layout/Header'
import Dicionario from '../features/landing/sections/Dicionario'
import Funcionamento from '../features/landing/sections/Funcionamento'
import Hero from '../features/landing/sections/Hero'
import Impacto from '../features/landing/sections/Impacto'
import Problema from '../features/landing/sections/Problema'
import Tecnologias from '../features/landing/sections/Tecnologias'

import Limitacoes from '../features/landing/sections/Limitacoes'
import Convite from '../features/landing/sections/Convite'

export default function LandingPage() {
  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual'
    }

    if (window.location.hash) {
      window.history.replaceState(null, '', window.location.pathname)
    }

    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [])

  return (
    <div className="education-landing">
      <Header />
      <main id="conteudo" tabIndex={-1}>
        <Hero />
        <Problema />
        <Funcionamento />
        <Dicionario />
        <Tecnologias />
        <Impacto />
        <Limitacoes />
        <Convite />
      </main>
      <Footer />
    </div>
  )
}
