import { ChevronLeft, ChevronRight, Hand } from 'lucide-react';
import { useState } from 'react';
import { useInView } from '../../../hooks/useInView';

const alphabet = Array.from({ length: 26 }, (_, i) => {
  const letter = String.fromCharCode(65 + i);
  if (letter === 'A') return { letter, description: 'Mão fechada, polegar ao lado dos dedos.' };
  if (letter === 'B') return { letter, description: 'Mão aberta, polegar dobrado sobre a palma.' };
  if (letter === 'C') return { letter, description: 'Mão curvada em formato de C.' };
  return { letter, description: `Configuração de mão para a letra ${letter}.` };
});

export default function Dicionario() {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [sectionRef, sectionInView] = useInView<HTMLElement>({ threshold: 0.12 });

  const currentLetter = alphabet[selectedIndex];

  const handlePrevious = () => {
    setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 25));
  };

  const handleNext = () => {
    setSelectedIndex((prev) => (prev < 25 ? prev + 1 : 0));
  };

  return (
    <section
      id="dicionario"
      ref={sectionRef}
      className="relative overflow-hidden bg-background-dark px-4 py-24"
      aria-labelledby="dicionario-title"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_50%,rgba(47,105,177,0.15),transparent_26rem)]" />

      <div
        className={`relative mx-auto max-w-6xl transition-all duration-700 ease-out ${
          sectionInView ? 'translate-y-0 opacity-100' : 'translate-y-7 opacity-0'
        }`}
      >
        <div className="mb-12 flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-end">
          <div className="max-w-2xl">
            <span className="font-ui text-xs font-semibold uppercase tracking-widest text-primary">
              Dicionário • Libras
            </span>
            <h2 id="dicionario-title" className="mt-4 font-ui text-4xl font-extrabold leading-tight text-text-light md:text-5xl">
              O alfabeto em Libras,<br />
              <span className="text-primary">letra por letra.</span>
            </h2>
          </div>
          <div className="max-w-md font-text text-sm leading-relaxed text-gray-mid">
            Lorem ipsum · Clique em qualquer letra para ver a configuração de mão correspondente. Use este mini-dicionário como ponto de partida para praticar a datilologia.
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_1.5fr] xl:gap-12">
          <div className="flex flex-col rounded-3xl border border-white/5 bg-[#0A1635] p-6 shadow-2xl">
            <div className="mb-6 flex items-center justify-between font-ui text-[10px] font-bold uppercase tracking-widest text-primary">
              <span>Sinal em destaque</span>
              <span className="text-text-light/50">
                {String(selectedIndex + 1).padStart(2, '0')} / 26
              </span>
            </div>

            <div className="flex aspect-[4/3] w-full flex-col items-center justify-center rounded-2xl bg-[#F8F9FA] text-[#0A1635]">
              <Hand size={64} strokeWidth={1}  className="text-[#f8f9fa]" />
              <span className="mt-4 font-ui text-2xl font-bold text-[#f8f9fa]">{currentLetter.letter}</span>
            </div>

            <div className="mt-8 flex items-end justify-between border-t border-white/10 pt-6">
              <div>
                <span className="block font-ui text-3xl font-extrabold text-text-light">{currentLetter.letter}</span>
                <p className="mt-2 font-text text-sm text-gray-mid">{currentLetter.description}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handlePrevious}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-transparent text-text-light transition-colors hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-primary"
                  aria-label="Letra anterior"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  onClick={handleNext}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-transparent text-text-light transition-colors hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-primary"
                  aria-label="Próxima letra"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-col justify-between gap-8">
            <div className="grid grid-cols-6 gap-3 sm:grid-cols-7 lg:grid-cols-7">
              {alphabet.map((item, index) => (
                <button
                  key={item.letter}
                  onClick={() => setSelectedIndex(index)}
                  className={`flex aspect-square items-center justify-center rounded-xl border font-ui text-xl font-bold transition-all focus:outline-none focus:ring-2 focus:ring-primary ${
                    selectedIndex === index
                      ? 'border-primary bg-primary/20 text-white shadow-[0_0_15px_rgba(47,105,177,0.3)]'
                      : 'border-white/5 bg-[#0A1635] text-text-light hover:border-white/20 hover:bg-white/5'
                  }`}
                >
                  {item.letter}
                </button>
              ))}
            </div>

            <div className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-white/5 bg-[#0A1635] p-5 sm:flex-row sm:items-center">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-primary">
                  <Hand size={20} />
                </div>
                <div>
                  <h3 className="font-ui text-sm font-bold text-text-light">Datilologia</h3>
                  <p className="font-text text-xs text-gray-mid">
                    <span className="text-primary">•</span> Sinais com movimento · imagem estática limitada
                  </p>
                </div>
              </div>
              <button className="whitespace-nowrap rounded-full border border-white/10 bg-transparent px-5 py-2 font-ui text-sm font-semibold text-text-light transition-colors hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-primary">
                Ver dicionário completo
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
