const REPLACEMENTS: Array<[RegExp, string]> = [
  [/\bportanto\b/gi, 'então'],
  [/\bcontudo\b|\bentretanto\b|\btodavia\b|\bporém\b|\bno entanto\b/gi, 'mas'],
  [/\balém disso\b/gi, 'e'],
  [/\bdevido a\b/gi, 'por causa de'],
  [/\ba fim de que\b/gi, 'para'],
  [/\bcom o objetivo de\b/gi, 'para'],
  [/\bde modo que\b/gi, 'para que'],
  [/\bem relação a\b|\ba respeito de\b/gi, 'sobre'],
  [/\bcaso contrário\b/gi, 'senão'],
  [/\bcaso\b/gi, 'se'],
  [/\bnecessário\b/gi, 'preciso'],
  [/\brealizar\b/gi, 'fazer'],
  [/\brealiza\b/gi, 'faz'],
  [/\bapenas\b/gi, 'só'],
  [/\bem breve\b/gi, 'em pouco tempo'],
  [/\ba partir de\b/gi, 'desde'],
  [/\bao invés de\b/gi, 'em vez de'],
  [/\btransmissão\b/gi, 'fala'],
  [/\bidentificar\b/gi, 'achar'],
  [/\bfornecer\b/gi, 'dar'],
  [/\butilizar\b/gi, 'usar'],
  [/\butiliza\b/gi, 'usa'],
  [/\bfotossíntese\b/gi, 'planta transforma luz em energia'],
  [/\bmitocôndria\b/gi, 'usina de energia da célula'],
  [/\bclorofila\b/gi, 'verde da folha que pega luz'],
  [/\bDNA\b|\bácido desoxirribonucleico\b/gi, 'código da vida'],
  [/\bcromossomo\b/gi, 'pacotinho de DNA'],
  [/\becossistema\b/gi, 'conjunto da natureza'],
  [/\bmembrana plasmática\b/gi, 'capa da célula'],
  [/\bcitoplasma\b/gi, 'interior da célula'],
  [/\bribossomo\b/gi, 'fábrica de proteínas da célula'],
  [/\bpróton\b/gi, 'carga positiva do átomo'],
  [/\belétron\b/gi, 'carga negativa do átomo'],
  [/\bnêutron\b/gi, 'carga neutra do átomo'],
  [/\bosmose\b/gi, 'passagem de água pela membrana'],
  [/\bmitose\b/gi, 'divisão celular para crescimento'],
  [/\bmeiose\b/gi, 'divisão celular para reprodução'],
  [/\bmetamorfose\b/gi, 'transformação do corpo'],
]

const MAX_SENTENCE_LENGTH = 90

function splitLongSentence(sentence: string): string {
  if (sentence.length <= MAX_SENTENCE_LENGTH) {
    return sentence
  }

  return sentence
    .replace(/,\s*/g, '. ')
    .replace(/;\s*/g, '. ')
    .replace(/:\s*/g, '. ')
}

function normalizeSpacing(text: string): string {
  return text
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/\s*([.,;:?!)])\s*/g, '$1 ')
    .replace(/\s*\(\s*/g, ' (')
    .replace(/\s*\)\s*/g, ') ')
    .replace(/\s+$/g, '')
}

export default function simplifyText(text: string): string {
  if (!text) {
    return ''
  }

  let simplified = text.trim()
  simplified = normalizeSpacing(simplified)

  for (const [pattern, replacement] of REPLACEMENTS) {
    simplified = simplified.replace(pattern, replacement)
  }

  const sentences = simplified
    .split(/([.?!])/)
    .reduce<string[]>((acc, part) => {
      if (part.match(/[.?!]/)) {
        const last = acc.pop() ?? ''
        acc.push(`${last.trim()}${part}`)
      } else if (part.trim().length) {
        acc.push(part.trim())
      }
      return acc
    }, [])

  const cleaned = sentences
    .map((sentence) => splitLongSentence(sentence.trim()))
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()

  return cleaned
}
