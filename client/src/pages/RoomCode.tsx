import { useState } from 'react'
import logoText from '../assets/LogoDualLibrasText.png'
import RoomHeader from '../features/classrooms/layout/RoomHeader'
import RoomCodeForm from '../features/classrooms/components/RoomCodeForm'

export default function RoomCode() {
  const [notice, setNotice] = useState('')

  return (
    <section className="relative isolate flex min-h-dvh flex-col overflow-hidden bg-background-dark font-text text-text-light">
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_50%_40%,#25589B55,transparent_65%)]"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -right-64 top-32 -z-10 size-[650px] rounded-full border border-primary/15"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-80 -left-60 -z-10 size-[700px] rounded-full border border-primary/15"
      />
      <RoomHeader
        onNavigate={(section) =>
          setNotice(`${section}: esta área ainda não está disponível nesta tela.`)
        }
      />
      <p role="status" className="mx-auto max-w-xl px-6 pt-4 text-center text-sm text-gray-mid">
        {notice}
      </p>
      <main className="flex flex-1 flex-col items-center justify-center px-5 py-14 sm:py-20">
        <section
          aria-labelledby="room-title"
          className="flex w-full max-w-sm flex-col items-center text-center"
        >
          <img
            src={logoText}
            alt="DualLibras"
            className="mb-10 max-h-64 w-72 max-w-full object-contain"
          />
          <h1 id="room-title" className="sr-only">
            Entrar na sala
          </h1>
          <RoomCodeForm />
        </section>
      </main>
    </section>
  )
}
