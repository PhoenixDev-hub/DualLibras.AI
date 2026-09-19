import { useState } from 'react'
import SignPlayer from '../../student/SignPlayer'
import '../../../styles/teacher.css'

type PracticeMode = 'alphabet' | 'numbers'

function PracticeSymbols({ mode }: { mode: PracticeMode }) {
  const symbols = mode === 'numbers' ? '0123456789' : 'ABCÇDEFGHIJKLMNOPQRSTUVWXYZ'
  const [symbol, setSymbol] = useState(symbols[0])
  const [autoPlay, setAutoPlay] = useState(false)
  const index = symbols.indexOf(symbol)
  const next = symbols[(index + 1) % symbols.length]
  return (
    <div className="min-w-0 text-slate-800">
      <p className="mb-5 text-sm text-slate-500">
        Escolha {mode === 'numbers' ? 'um número de 0 a 9' : 'uma letra, incluindo Ç'} e pressione
        “Sinalizar em Libras” para ver o avatar.
      </p>
      <div className="mb-7 grid grid-cols-5 gap-2 sm:grid-cols-7">
        {symbols.split('').map((item) => (
          <button
            key={item}
            aria-pressed={symbol === item}
            aria-label={`${mode === 'numbers' ? 'Número' : 'Letra'} ${item}`}
            className={`rounded-xl border p-4 text-2xl font-bold ${symbol === item ? 'border-primary bg-primary text-white' : 'border-slate-200 bg-white text-primary'}`}
            onClick={() => {
              setAutoPlay(false)
              setSymbol(item)
            }}
          >
            {item}
          </button>
        ))}
      </div>
      <SignPlayer
        key={`${mode}-${symbol}`}
        text={symbol}
        autoPlay={autoPlay}
        title={`${mode === 'numbers' ? 'Número' : 'Letra'} ${symbol}`}
        progress={`${index + 1} de ${symbols.length}`}
        onNext={() => {
          setAutoPlay(true)
          setSymbol(next)
        }}
        nextLabel={
          index === symbols.length - 1
            ? `Recomeçar em ${next}`
            : `${mode === 'numbers' ? 'Próximo número' : 'Próxima letra'}: ${next}`
        }
      />
    </div>
  )
}

export default function LibrasPractice({ mode }: { mode?: PracticeMode }) {
  const [selected, setSelected] = useState<PracticeMode>('alphabet')
  const active = mode ?? selected
  return (
    <section aria-label="Praticar Libras" className="min-w-0">
      {!mode && (
        <div className="mb-6 flex flex-wrap gap-3" role="group" aria-label="Escolher conteúdo">
          <button
            className={active === 'alphabet' ? 't-btn' : 't-btn-secondary'}
            aria-pressed={active === 'alphabet'}
            onClick={() => setSelected('alphabet')}
          >
            Alfabeto em Libras
          </button>
          <button
            className={active === 'numbers' ? 't-btn' : 't-btn-secondary'}
            aria-pressed={active === 'numbers'}
            onClick={() => setSelected('numbers')}
          >
            Números em Libras
          </button>
        </div>
      )}
      <PracticeSymbols key={active} mode={active} />
    </section>
  )
}
