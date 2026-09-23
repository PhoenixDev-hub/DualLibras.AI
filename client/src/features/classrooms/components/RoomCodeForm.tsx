import { useState, type FormEvent } from 'react'

type Props = { onJoin?: (code: string) => Promise<void> | void }

export default function RoomCodeForm({ onJoin }: Props) {
  const [code, setCode] = useState('')
  const [message, setMessage] = useState('')
  const [pending, setPending] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!code.trim()) {
      setMessage('Digite o código informado pelo professor.')
      return
    }
    if (!onJoin) {
      setMessage('A entrada por código ainda não está disponível.')
      return
    }
    setMessage('')
    setPending(true)
    try {
      await onJoin(code.trim())
    } catch (err) {
      setMessage(
        err instanceof Error
          ? err.message
          : 'Não foi possível entrar. Confira o código e tente novamente.',
      )
    } finally {
      setPending(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full text-left border-t border-text-light/20 pt-5">
      <label htmlFor="room-code" className="font-ui text-sm font-bold">
        Código da sala
      </label>
      <p id="code-help" className="mt-2 text-sm leading-relaxed text-gray-mid">
        Use o código compartilhado pelo seu professor.
      </p>
      <label className="mt-5 flex items-center gap-3 rounded-lg border border-text-light/20 bg-text-light/5 px-4 focus-within:border-text-light">
        <input
          id="room-code"
          value={code}
          onChange={(event) => {
            setCode(event.target.value)
            setMessage('')
          }}
          aria-describedby="code-help code-message"
          placeholder="Digite o código"
          autoComplete="off"
          spellCheck={false}
          disabled={pending}
          className="min-w-0 w-full bg-transparent py-4 font-ui text-lg font-semibold tracking-wider text-text-light outline-none placeholder:text-gray-mid placeholder:tracking-normal"
        />
      </label>
      <button
        disabled={pending}
        className="mt-4 inline-flex min-h-13 w-full items-center justify-center gap-3 rounded-lg bg-primary px-5 py-3 font-ui font-bold text-white transition-colors hover:bg-secondary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-text-light disabled:opacity-60"
      >
        {pending ? 'Entrando…' : 'Entrar na sala'}
      </button>
      <p id="code-message" role="status" className="mt-3 text-sm leading-relaxed text-text-light">
        {message}
      </p>
    </form>
  )
}
