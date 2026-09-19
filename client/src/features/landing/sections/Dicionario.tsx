import { useState } from 'react'
import LibrasPractice from '../../libras/components/LibrasPractice'

export default function Dicionario() {
  const [open, setOpen] = useState(false)
  return (
    <section
      id="dicionario"
      className="relative bg-background-dark px-4 py-24"
      aria-labelledby="dicionario-title"
    >
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 max-w-2xl">
          <span className="font-ui text-xs font-semibold uppercase tracking-widest text-primary">
            Dicionário · Libras
          </span>
          <h2
            id="dicionario-title"
            className="mt-4 font-ui text-4xl font-extrabold leading-tight text-text-light md:text-5xl"
          >
            Alfabeto e números
            <br />
            <span className="text-primary">em Libras.</span>
          </h2>
          <p className="mt-5 text-sm leading-relaxed text-gray-mid">
            Explore as letras, incluindo Ç, e os números de 0 a 9. Acompanhe os sinais com o avatar
            e avance no seu ritmo.
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 sm:p-8">
          {open ? (
            <>
              <button className="t-btn-secondary mb-6" onClick={() => setOpen(false)}>
                Fechar prática
              </button>
              <LibrasPractice />
            </>
          ) : (
            <div className="text-slate-800">
              <h3 className="mb-3 text-xl font-bold">Experimente o avatar em Libras</h3>
              <p className="mb-5 text-sm text-slate-500">
                Escolha entre alfabeto e números e use o botão de próximo sinal para continuar.
              </p>
              <button className="t-btn" onClick={() => setOpen(true)}>
                Praticar alfabeto e números
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
