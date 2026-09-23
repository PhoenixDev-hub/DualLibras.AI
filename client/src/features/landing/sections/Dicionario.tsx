import { useState } from 'react'
import { ArrowRight, Hand } from 'lucide-react'
import LibrasPractice from '../../libras/components/LibrasPractice'

export default function Dicionario() {
  const [open, setOpen] = useState(false)
  return (
    <section
      id="dicionario"
      className="edu-section edu-practice"
      aria-labelledby="dicionario-title"
    >
      <div className="edu-container">
        <div className="edu-practice-intro">
          <div>
            <span className="edu-eyebrow">
              <Hand size={18} aria-hidden="true" /> Dicionário
            </span>
            <h2 id="dicionario-title">Aprenda Libras no seu ritmo.</h2>
            <p>
              Explore o alfabeto, incluindo o Ç, e os números de 0 a 9. Visualize os sinais com o
              avatar e pratique enquanto aprende.
            </p>
          </div>
          <div className="edu-letter-tiles" aria-hidden="true">
            <span>A</span>
            <span>B</span>
            <span>C</span>
            <span>1</span>
            <span>2</span>
            <span>3</span>
          </div>
        </div>
        <article className="edu-practice-panel">
          {open ? (
            <>
              <button
                className="edu-button edu-button-outline"
                aria-expanded={open}
                aria-controls="edu-practice-content"
                onClick={() => setOpen(false)}
              >
                Fechar prática
              </button>
              <div id="edu-practice-content" className="edu-practice-content">
                <LibrasPractice />
              </div>
            </>
          ) : (
            <>
              <div>
                <h3>Seu primeiro passo pode ser aqui</h3>
                <p>
                  Pratique as letras, incluindo Ç, e os números de 0 a 9. Não precisa de uma conta
                  para experimentar.
                </p>
              </div>
              <button className="edu-button" aria-expanded={open} onClick={() => setOpen(true)}>
                Explorar alfabeto e números <ArrowRight size={18} aria-hidden="true" />
              </button>
            </>
          )}
        </article>
      </div>
    </section>
  )
}
