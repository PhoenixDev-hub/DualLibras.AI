import { useState, type FormEvent } from 'react'
import { Plus, X } from 'lucide-react'
import DashboardHome from './DashboardHome'
import DashboardSidebar from './DashboardSidebar'
import DashboardTopbar from './DashboardTopbar'
import ManagementSection from './ManagementSection'
import { type DashboardSection } from './dashboardData'
import { authApi, type DashboardData, type DashboardUser } from '../../services/authApi'

type DashboardLayoutProps = {
  user: DashboardUser
  dashboard: DashboardData
  onDashboardChange: (dashboard: DashboardData) => void
}

export default function DashboardLayout({ user, dashboard, onDashboardChange }: DashboardLayoutProps) {
  const [activeSection, setActiveSection] = useState<DashboardSection>(dashboard.access.sections[0] ?? 'Dashboard')
  const [showCreateClassroom, setShowCreateClassroom] = useState(false)
  const [classroomName, setClassroomName] = useState('')
  const [showUploadMaterial, setShowUploadMaterial] = useState(false)
  const [selectedMaterial, setSelectedMaterial] = useState<File | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')

  function openCreateClassroom() {
    setError('')
    setShowCreateClassroom(true)
  }

  function openUploadMaterial() {
    setError('')
    setShowUploadMaterial(true)
  }

  function readFileAsDataUrl(file: File) {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result))
      reader.onerror = () => reject(new Error('Não foi possível ler o arquivo.'))
      reader.readAsDataURL(file)
    })
  }

  async function handleCreateClassroom(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setIsSaving(true)

    try {
      await authApi.createClassroom(classroomName)
      const updatedDashboard = await authApi.dashboard()
      onDashboardChange(updatedDashboard)
      setActiveSection('Minhas Turmas')
      setClassroomName('')
      setShowCreateClassroom(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível criar a sala.')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleUploadMaterial(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')

    if (!selectedMaterial) {
      setError('Selecione um arquivo para enviar.')
      return
    }

    setIsSaving(true)

    try {
      const contentBase64 = await readFileAsDataUrl(selectedMaterial)
      await authApi.uploadMaterial({
        filename: selectedMaterial.name,
        contentBase64,
      })
      const updatedDashboard = await authApi.dashboard()
      onDashboardChange(updatedDashboard)
      setActiveSection('Materiais')
      setSelectedMaterial(null)
      setShowUploadMaterial(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível enviar o material.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-slate-100">
      <DashboardSidebar
        activeSection={activeSection}
        menuItems={dashboard.menuItems}
        user={user}
        onSectionChange={setActiveSection}
      />

      <section className="lg:pl-72">
        <DashboardTopbar
          activeSection={activeSection}
          menuItems={dashboard.menuItems}
          user={user}
          onSectionChange={setActiveSection}
        />

        <section className="px-4 py-6 sm:px-6 lg:px-8">
          {activeSection === 'Dashboard' ? (
            <DashboardHome
              user={user}
              dashboard={dashboard}
              onCreateClassroom={openCreateClassroom}
              onUploadMaterial={openUploadMaterial}
            />
          ) : (
            <ManagementSection
              section={activeSection}
              dashboard={dashboard}
              onCreateClassroom={openCreateClassroom}
              onUploadMaterial={openUploadMaterial}
            />
          )}
        </section>
      </section>

      {showCreateClassroom && (
        <section className="fixed inset-0 z-50 grid place-items-center bg-slate-950/60 px-4 py-6">
          <article className="w-full max-w-2xl rounded-lg border border-slate-200 bg-white p-5 shadow-xl dark:border-slate-800 dark:bg-slate-900">
            <header className="flex items-start justify-between gap-4">
              <section>
                <h2 className="text-xl font-black">Nova sala acessível</h2>
                <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  Crie uma sala para aulas, palestras ou encontros sociais com suporte a voz para Libras.
                </p>
              </section>
              <button
                type="button"
                onClick={() => setShowCreateClassroom(false)}
                className="grid h-10 w-10 place-items-center rounded-lg border border-slate-200 text-slate-700 transition hover:bg-slate-100 dark:border-slate-800 dark:text-slate-200 dark:hover:bg-slate-800"
                aria-label="Fechar criação de sala"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </header>

            <form onSubmit={handleCreateClassroom} className="mt-5 grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
              <label className="block">
                <span className="text-sm font-bold text-slate-700 dark:text-slate-200">Nome da sala</span>
                <input
                  value={classroomName}
                  onChange={(event) => setClassroomName(event.target.value)}
                  placeholder="Ex.: Matemática 2º Ano A ou Palestra de acessibilidade"
                  className="mt-2 h-12 w-full rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-950 outline-none transition focus:border-blue-700 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                  minLength={2}
                  autoFocus
                  required
                />
              </label>
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-blue-700 px-5 text-sm font-bold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Plus className="h-5 w-5" aria-hidden="true" />
                {isSaving ? 'Criando...' : 'Criar sala'}
              </button>
            </form>

            {error && (
              <p className="mt-4 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
                {error}
              </p>
            )}
          </article>
        </section>
      )}

      {showUploadMaterial && (
        <section className="fixed inset-0 z-50 grid place-items-center bg-slate-950/60 px-4 py-6">
          <article className="w-full max-w-2xl rounded-lg border border-slate-200 bg-white p-5 shadow-xl dark:border-slate-800 dark:bg-slate-900">
            <header className="flex items-start justify-between gap-4">
              <section>
                <h2 className="text-xl font-black">Enviar material para IA</h2>
                <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  Envie PDF, Word, PowerPoint ou Texto para apoiar a transcrição e a tradução voz para Libras.
                </p>
              </section>
              <button
                type="button"
                onClick={() => setShowUploadMaterial(false)}
                className="grid h-10 w-10 place-items-center rounded-lg border border-slate-200 text-slate-700 transition hover:bg-slate-100 dark:border-slate-800 dark:text-slate-200 dark:hover:bg-slate-800"
                aria-label="Fechar envio de material"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </header>

            <form onSubmit={handleUploadMaterial} className="mt-5 grid gap-4">
              <label className="block">
                <span className="text-sm font-bold text-slate-700 dark:text-slate-200">Arquivo</span>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.txt"
                  onChange={(event) => setSelectedMaterial(event.target.files?.[0] ?? null)}
                  className="mt-2 block w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-950 file:mr-4 file:rounded-lg file:border-0 file:bg-blue-700 file:px-4 file:py-2 file:text-sm file:font-bold file:text-white dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                  required
                />
              </label>

              <section className="grid gap-2 rounded-lg border border-slate-100 bg-slate-50 p-4 text-sm font-semibold text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 sm:grid-cols-4">
                <span>PDF</span>
                <span>Documento Word</span>
                <span>Apresentação</span>
                <span>Texto</span>
              </section>

              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-blue-700 px-5 text-sm font-bold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Plus className="h-5 w-5" aria-hidden="true" />
                {isSaving ? 'Enviando...' : 'Enviar material'}
              </button>
            </form>

            {error && (
              <p className="mt-4 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
                {error}
              </p>
            )}
          </article>
        </section>
      )}
    </main>
  )
}
