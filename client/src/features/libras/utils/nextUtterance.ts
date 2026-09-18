type Utterance = { id: number; text: string }

// Combine short waiting fragments into one translation request. Never remove
// words to catch up, and keep the one-time greeting separate from lesson text.
export function takeNextUtterance(queue: Utterance[], maxWords = 24): Utterance | undefined {
  const first = queue.shift()
  if (!first || first.id === 0) return first
  let text = first.text
  let id = first.id
  let words = text.split(/\s+/).length
  while (queue.length && queue[0].id !== 0) {
    const nextWords = queue[0].text.split(/\s+/).length
    if (words + nextWords > maxWords) break
    const next = queue.shift()!
    text += ` ${next.text}`
    id = next.id
    words += nextWords
  }
  return { id, text }
}
