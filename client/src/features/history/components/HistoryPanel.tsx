import {
  FileCode,
  FileText,
  Save,
  Settings as SettingsIcon,
} from 'lucide-react'
import { API_BASE } from '../../../config/backend'
import type { SavedGroup } from '../hooks/useTranscriptHistory'

type HistoryPanelProps = {
  showPanel: boolean
  setShowPanel: (show: boolean) => void
  titulo: string
  setTitulo: (titulo: string) => void
  isSaving: boolean
  savedGroups: SavedGroup[]
  salvarAula: () => void
  limparTranscricaoAtual: () => void
}

export function HistoryPanel({
  showPanel,
  setShowPanel,
  titulo,
  setTitulo,
  isSaving,
  savedGroups,
  salvarAula,
  limparTranscricaoAtual,
}: HistoryPanelProps) {
  return (
    <div
      className={`fixed inset-y-0 right-0 z-50 flex w-[min(90vw,440px)] flex-col border-l border-[#82E3FF]/20 light:border-blue-500/20 bg-[#020B2B]/95 light:bg-white/95 p-6 shadow-[0_0_50px_rgba(20,93,255,0.25)] backdrop-blur-md transition-transform duration-300 ${
        showPanel ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      <div className="flex items-center justify-between border-b border-[#82E3FF]/20 light:border-blue-500/20 pb-4">
        <h2 className="text-lg font-black text-[#F2F6FF] light:text-slate-900">
          Gerenciador de Aulas
        </h2>
        <button
          onClick={() => setShowPanel(false)}
          className="cursor-pointer text-sm font-bold text-[#B7C8EF] light:text-slate-600 hover:text-[#82E3FF] light:hover:text-blue-700"
        >
          Fechar x
        </button>
      </div>

      <div className="mt-6 border-b border-[#82E3FF]/10 light:border-blue-500/10 pb-6">
        <h3 className="mb-3 text-xs font-extrabold uppercase tracking-wider text-[#82E3FF] light:text-blue-700">
          Salvar Transcrição Atual
        </h3>
        <div className="flex flex-col gap-3">
          <input
            type="text"
            value={titulo}
            onChange={(event) => setTitulo(event.target.value)}
            placeholder="Título da Aula"
            className="w-full rounded-lg border border-[#82E3FF]/25 light:border-blue-500/25 bg-black/40 light:bg-slate-50/40 px-3 py-2 text-sm text-[#F2F6FF] light:text-slate-900 outline-none focus:border-[#82E3FF] light:focus:border-blue-500 focus:shadow-[0_0_8px_rgba(130,227,255,0.4)]"
          />
          <div className="flex gap-2">
            <button
              onClick={salvarAula}
              disabled={isSaving}
              className="flex flex-1 items-center justify-center gap-2 cursor-pointer rounded-lg bg-gradient-to-r from-[#145DFF] to-[#82E3FF] py-2 text-xs font-black text-black hover:opacity-90 disabled:opacity-50"
            >
              {isSaving ? (
                'Salvando...'
              ) : (
                <>
                  <Save className="w-4 h-4" /> Salvar Aula
                </>
              )}
            </button>
            <button
              onClick={limparTranscricaoAtual}
              className="cursor-pointer rounded-lg border border-[#2F7BFF]/30 bg-[#2F7BFF]/10 px-3 py-2 text-xs font-bold text-[#B7C8EF] light:text-slate-600 hover:bg-[#2F7BFF]/20"
            >
              Limpar
            </button>
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-1 flex-col overflow-hidden">
        <h3 className="mb-3 text-xs font-extrabold uppercase tracking-wider text-[#82E3FF] light:text-blue-700">
          Histórico de Arquivos
        </h3>

        <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-3">
          {savedGroups.length === 0 ? (
            <p className="text-xs text-[#B7C8EF] light:text-slate-600 italic">
              Nenhuma aula salva no servidor.
            </p>
          ) : (
            savedGroups.map((group) => (
              <div
                key={group.id}
                className="rounded-lg border border-[#82E3FF]/10 light:border-blue-500/10 bg-black/20 light:bg-slate-50/20 p-3 flex flex-col gap-2"
              >
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-[#F2F6FF] light:text-slate-900">
                    {group.pdf
                      ? group.pdf.replace('transcricao_', '').replace('.pdf', '')
                      : group.id}
                  </span>
                  <span className="text-[10px] text-[#B7C8EF] light:text-slate-600">
                    {group.dateStr}
                  </span>
                </div>
                <div className="flex gap-1.5 mt-1">
                  {group.pdf && (
                    <a
                      href={`${API_BASE}/transcripts/download/${group.pdf}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 rounded bg-[#82E3FF]/10 border border-[#82E3FF]/30 light:border-blue-500/30 px-2 py-1 text-[10px] font-bold text-[#82E3FF] light:text-blue-700 hover:bg-[#82E3FF]/20"
                    >
                      <FileText className="w-3 h-3" /> PDF
                    </a>
                  )}
                  {group.txt && (
                    <a
                      href={`${API_BASE}/transcripts/download/${group.txt}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 rounded bg-[#2F7BFF]/10 border border-[#2F7BFF]/30 px-2 py-1 text-[10px] font-bold text-[#53B8FF] light:text-blue-700 hover:bg-[#2F7BFF]/20"
                    >
                      <FileCode className="w-3 h-3" /> TXT
                    </a>
                  )}
                  {group.json && (
                    <a
                      href={`${API_BASE}/transcripts/download/${group.json}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 rounded bg-gray-800 light:bg-white border border-gray-700 px-2 py-1 text-[10px] font-bold text-[#B7C8EF] light:text-slate-600 hover:bg-gray-700"
                    >
                      <SettingsIcon className="w-3 h-3" /> JSON
                    </a>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  )
}
