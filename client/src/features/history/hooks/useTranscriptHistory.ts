import { useState } from 'react'
import { API_BASE } from '../../../config/backend'
import type { TranscriptMessage } from '../../transcription/services/websocket'

export type SavedGroup = {
  id: string
  dateStr: string
  pdf?: string
  txt?: string
  json?: string
}

const formatFilenameDate = (timestamp: string) => {
  try {
    const parts = timestamp.split('_')
    const datePart = parts[0]
    const timePart = parts[1]
    const year = datePart.substring(0, 4)
    const month = datePart.substring(4, 6)
    const day = datePart.substring(6, 8)
    const hour = timePart.substring(0, 2)
    const minute = timePart.substring(2, 4)
    return `${day}/${month}/${year} às ${hour}:${minute}`
  } catch {
    return timestamp
  }
}

type UseTranscriptHistoryOptions = {
  onClearCurrentTranscript: () => void
  getTranscript: () => TranscriptMessage[]
}

export function useTranscriptHistory({ onClearCurrentTranscript, getTranscript }: UseTranscriptHistoryOptions) {
  const [showPanel, setShowPanel] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [titulo, setTitulo] = useState('Aula de Acessibilidade')
  const [savedGroups, setSavedGroups] = useState<SavedGroup[]>([])

  const carregarHistoricoSalvo = async () => {
    try {
      const response = await fetch(`${API_BASE}/transcripts`, { credentials: 'include' })
      if (!response.ok) throw new Error('Erro ao listar arquivos')
      const data = (await response.json()) as {
        total: number
        pdfs: string[]
        texts: string[]
        metadata: string[]
      }

      const groupsMap = new Map<string, Partial<SavedGroup>>()
      const getGroupId = (filename: string) => {
        return filename.replace(/^transcricao_/, '').replace(/(?:_metadata)?\.(pdf|txt|json)$/, '')
      }

      data.pdfs.forEach((pdf) => {
        const id = getGroupId(pdf)
        if (!groupsMap.has(id)) groupsMap.set(id, { id })
        groupsMap.get(id)!.pdf = pdf
      })

      data.texts.forEach((txt) => {
        const id = getGroupId(txt)
        if (!groupsMap.has(id)) groupsMap.set(id, { id })
        groupsMap.get(id)!.txt = txt
      })

      data.metadata.forEach((meta) => {
        const id = getGroupId(meta)
        if (!groupsMap.has(id)) groupsMap.set(id, { id })
        groupsMap.get(id)!.json = meta
      })

      const list: SavedGroup[] = []
      groupsMap.forEach((value, key) => {
        list.push({
          id: key,
          dateStr: formatFilenameDate(key),
          pdf: value.pdf,
          txt: value.txt,
          json: value.json,
        })
      })

      list.sort((a, b) => b.id.localeCompare(a.id))
      setSavedGroups(list)
    } catch (error) {
      console.error('Falha ao carregar histórico salvo:', error)
    }
  }

  const abrirPainel = () => {
    setShowPanel(true)
    carregarHistoricoSalvo()
  }

  const salvarAula = async () => {
    const cache = getTranscript()
    if (cache.length === 0) {
      alert('Não há transcrição acumulada para salvar nesta sessão.')
      return
    }

    const fullText = cache
      .map((message) => `${message.speaker || 'Palestrante'}: ${message.text}`)
      .join('\n\n')

    setIsSaving(true)
    try {
      const response = await fetch(`${API_BASE}/save-transcript`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: fullText,
          title: titulo,
          formats: ['pdf', 'txt', 'json'],
          metadata: {
            evento: 'Festival 2026',
            origem: 'Interface Web',
            total_sentencas: cache.length,
          },
        }),
      })

      if (!response.ok) throw new Error('Erro ao salvar transcrição')

      alert('Aula salva com sucesso!')
      carregarHistoricoSalvo()
    } catch (error) {
      console.error(error)
      alert('Falha ao salvar a transcrição.')
    } finally {
      setIsSaving(false)
    }
  }

  const limparTranscricaoAtual = () => {
    if (confirm('Tem certeza que deseja limpar a transcrição atual?')) {
      onClearCurrentTranscript()
    }
  }


  return {
    showPanel,
    setShowPanel,
    isSaving,
    titulo,
    setTitulo,
    savedGroups,
    abrirPainel,
    salvarAula,
    limparTranscricaoAtual,
  }
}
