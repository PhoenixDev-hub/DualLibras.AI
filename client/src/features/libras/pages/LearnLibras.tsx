import { useState } from 'react'
import { Hand, Image } from 'lucide-react'
import { Modal, PageTitle } from '../../../components/ui'
export default function LearnLibras() {
  const [letter, setLetter] = useState<string | null>(null)
  return (
    <>
      <PageTitle
        eyebrow="Novas formas de se conectar"
        title="Aprender Libras"
        description="Conheça o espaço dedicado ao alfabeto manual em Libras."
      />
      <section className="mb-7 flex items-center gap-4 rounded-2xl border border-blue-100 bg-blue-50 p-5">
        <Hand size={30} className="shrink-0 text-primary" />
        <p className="text-sm leading-6 text-slate-600">
          Selecione uma letra para explorar seu espaço de aprendizado. As imagens e os vídeos dos
          sinais serão adicionados após validação por profissionais de Libras.
        </p>
      </section>
      <section className="grid grid-cols-3 gap-4 sm:grid-cols-5 lg:grid-cols-7">
        {'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map((item) => (
          <button
            key={item}
            onClick={() => setLetter(item)}
            className="t-card group p-5 text-center transition hover:-translate-y-1 hover:border-primary hover:shadow-md"
            aria-label={`Abrir letra ${item}`}
          >
            <span className="block font-ui text-4xl font-bold text-primary">{item}</span>
            <span className="mt-4 block text-[10px] text-slate-400">Ver espaço do sinal</span>
          </button>
        ))}
      </section>
      {letter && (
        <Modal title={`Letra ${letter} · Alfabeto em Libras`} onClose={() => setLetter(null)}>
          <section className="flex aspect-video flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed border-blue-200 bg-blue-50 text-primary">
            <Image size={40} />
            <p className="text-sm font-semibold">Placeholder de imagem ou vídeo</p>
          </section>
          <p className="mt-5 text-sm leading-6 text-slate-500">
            Espaço reservado para o sinal da letra {letter}. Nenhum sinal está representado. O
            conteúdo didático aguarda validação especializada.
          </p>
        </Modal>
      )}
    </>
  )
}
