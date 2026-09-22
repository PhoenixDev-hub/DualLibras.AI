import { useAutoRefresh } from '../../hooks/useAutoRefresh'
import { useCallback, useEffect, useState, type ReactNode } from 'react'
import {
  Building2,
  Users,
  LayoutGrid,
  Video,
  FileText,
  ShieldCheck,
  Home,
  Plus,
  RefreshCw,
  Pencil,
  Trash2,
  KeyRound,
  Ban,
  CheckCircle,
  Download,
  Settings,
} from 'lucide-react'
import DashboardShell from '../../components/layout/DashboardShell'
import { Empty, Modal, PageTitle, SearchInput } from '../../components/ui'
import { AUTH_API_BASE } from '../../config/backend'
import { useTeacher } from '../../contexts/TeacherContext'
import { ApiError, type DashboardUser } from '../../services/authApi'
import Materials from '../materials/pages/Materials'
import AdminEditor, { type Editor } from './AdminEditor'
import AdminMembers from './AdminMembers'
import AdminLessonPreview from './AdminLessonPreview'
import {
  adminApi,
  roleLabels,
  lessonLabels,
  type Resource,
  type Page,
  type AdminEntities,
  type AdminOptions,
  type AdminOverview,
  type AdminClassroom,
} from './adminApi'

const navigation = [
  { label: 'Visão geral', icon: Home },
  { label: 'Escolas', icon: Building2 },
  { label: 'Usuários', icon: Users },
  { label: 'Salas', icon: LayoutGrid },
  { label: 'Aulas', icon: Video },
  { label: 'Materiais', icon: FileText },
  { label: 'Minha conta', icon: Settings },
]
const resources: Record<string, Resource> = {
  Escolas: 'schools',
  Usuários: 'users',
  Salas: 'classrooms',
  Aulas: 'lessons',
  Materiais: 'materials',
}
type Entity = AdminEntities[Resource]
type Confirmation = {
  title: string
  description: string
  action: () => Promise<unknown>
  label: string
}
function Action({
  label,
  children,
  onClick,
  disabled = false,
  danger = false,
}: {
  label: string
  children: ReactNode
  onClick: () => void
  disabled?: boolean
  danger?: boolean
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      className={`t-icon ${danger ? 'text-red-600' : 'text-slate-500'}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  )
}
function Table({ headers, children }: { headers: string[]; children: ReactNode }) {
  return (
    <div className="t-card overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
          <tr>
            {headers.map((header) => (
              <th key={header} className="px-5 py-4 font-semibold">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 [&_td]:px-5 [&_td]:py-4">{children}</tbody>
      </table>
    </div>
  )
}
export default function AdminDashboard({
  user,
  logout,
}: {
  user: DashboardUser
  logout: () => Promise<void>
}) {
  const { refresh: refreshEducation } = useTeacher()
  const [view, setView] = useState('Visão geral')
  const [overview, setOverview] = useState<AdminOverview | null>(null)
  const [options, setOptions] = useState<AdminOptions>({
    schools: [],
    teachers: [],
    classrooms: [],
  })
  const [list, setList] = useState<Page<Entity> | null>(null)
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [schoolId, setSchoolId] = useState('')
  const [role, setRole] = useState('')
  const [active, setActive] = useState('')
  const [version, setVersion] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [editor, setEditor] = useState<Editor | null>(null)
  const [previewLesson, setPreviewLesson] = useState<string | null>(null)
  const [members, setMembers] = useState<AdminClassroom | null>(null)
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null)
  const [actionError, setActionError] = useState('')
  const [busy, setBusy] = useState(false)
  const [uploading, setUploading] = useState(false)
  const resource = resources[view]
  useAutoRefresh(
    async (isCurrent) => {
      const [summary, choices, data] = await Promise.all([
        adminApi.overview(),
        adminApi.options(),
        resource
          ? adminApi.list(resource, {
              q: query,
              page,
              schoolId: resource === 'schools' ? '' : schoolId,
              role: resource === 'users' ? role : '',
              active: resource === 'users' ? active : '',
            })
          : Promise.resolve(null),
      ])
      if (!isCurrent()) return
      setOverview((current) =>
        JSON.stringify(current) === JSON.stringify(summary) ? current : summary,
      )
      setOptions((current) =>
        JSON.stringify(current) === JSON.stringify(choices) ? current : choices,
      )
      setList((current) => (JSON.stringify(current) === JSON.stringify(data) ? current : data))
    },
    { enabled: !loading, scope: JSON.stringify([resource, query, page, schoolId, role, active]) },
  )
  const fail = useCallback(
    (err: unknown) => {
      if (err instanceof ApiError && err.status === 401) {
        void logout()
        return
      }
      setError(err instanceof Error ? err.message : 'Não foi possível carregar a administração.')
    },
    [logout],
  )
  useEffect(() => {
    let current = true
    const timer = window.setTimeout(
      () => {
        setLoading(true)
        setError('')
        Promise.all([
          adminApi.overview(),
          adminApi.options(),
          resource
            ? adminApi.list(resource, {
                q: query,
                page,
                schoolId: resource === 'schools' ? '' : schoolId,
                role: resource === 'users' ? role : '',
                active: resource === 'users' ? active : '',
              })
            : Promise.resolve(null),
        ])
          .then(([summary, choices, data]) => {
            if (current) {
              setOverview(summary)
              setOptions(choices)
              setList(data)
            }
          })
          .catch((err) => {
            if (current) fail(err)
          })
          .finally(() => {
            if (current) setLoading(false)
          })
      },
      query ? 250 : 0,
    )
    return () => {
      current = false
      window.clearTimeout(timer)
    }
  }, [resource, query, page, schoolId, role, active, version, fail])
  function navigate(next: string) {
    setView(next)
    setQuery('')
    setPage(1)
    setSchoolId('')
    setRole('')
    setActive('')
    setList(null)
    setUploading(false)
    setError('')
  }
  const reload = () => setVersion((value) => value + 1)
  async function saved(signOut: boolean) {
    setEditor(null)
    setNotice('Alteração salva com sucesso.')
    if (signOut) {
      await logout()
      return
    }
    reload()
  }
  function remove(kind: Resource, id: string, name: string) {
    setActionError('')
    setConfirmation({
      title: `Excluir ${name}?`,
      description:
        kind === 'lessons'
          ? 'A aula, suas transcrições e seu resumo serão excluídos permanentemente. Remova os materiais vinculados antes de continuar.'
          : kind === 'materials'
            ? 'O material será removido do sistema e deixará de estar disponível para download.'
            : kind === 'users'
              ? 'A conta e suas participações serão excluídas. Contas com conteúdo vinculado precisam ser bloqueadas ou ter seus vínculos tratados primeiro.'
              : 'Esta operação não pode ser desfeita. Os vínculos existentes precisam ser tratados antes da exclusão.',
      label: 'Excluir',
      action: () => adminApi.remove(kind, id),
    })
  }
  async function confirm() {
    if (!confirmation || busy) return
    setBusy(true)
    setActionError('')
    try {
      await confirmation.action()
      setConfirmation(null)
      setNotice('Alteração concluída.')
      setPage(1)
      reload()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Não foi possível concluir.')
    } finally {
      setBusy(false)
    }
  }
  async function openUpload() {
    if (busy) return
    setBusy(true)
    setError('')
    try {
      await refreshEducation()
      setUploading(true)
    } catch (err) {
      fail(err)
    } finally {
      setBusy(false)
    }
  }
  const items = list?.items ?? []
  return (
    <DashboardShell
      user={user}
      logout={logout}
      navigation={navigation}
      page={view}
      breadcrumbs={[
        { label: 'Administração', onClick: () => navigate('Visão geral') },
        ...(view === 'Visão geral' ? [] : [{ label: view }]),
      ]}
      onNavigate={navigate}
      onSearch={(value) => {
        navigate('Usuários')
        setQuery(value)
      }}
      searchPlaceholder="Buscar usuários por nome ou e-mail..."
      onNotice={setNotice}
      onProfile={() => navigate('Minha conta')}
    >
      {notice && (
        <div
          role="status"
          className="mb-5 flex items-center justify-between gap-4 rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-primary"
        >
          <span>{notice}</span>
          <button onClick={() => setNotice('')} aria-label="Fechar mensagem">
            Fechar
          </button>
        </div>
      )}
      <PageTitle
        eyebrow="Administração"
        title={view === 'Visão geral' ? 'Toda a rede em um só lugar' : view}
        description={
          view === 'Visão geral'
            ? 'Acompanhe as escolas, as pessoas e as atividades da plataforma.'
            : 'Gerencie os dados da plataforma com acesso administrativo.'
        }
        action={
          <div className="flex flex-wrap gap-2">
            <button className="t-btn-secondary" disabled={loading || busy} onClick={reload}>
              <RefreshCw size={16} />
              Atualizar
            </button>
            {['schools', 'users', 'classrooms', 'lessons'].includes(resource) && (
              <button
                className="t-btn"
                disabled={loading || !!error}
                onClick={() =>
                  setEditor({ kind: resource as 'schools' | 'users' | 'classrooms' | 'lessons' })
                }
              >
                <Plus size={16} />
                {resource === 'schools'
                  ? 'Nova escola'
                  : resource === 'users'
                    ? 'Novo usuário'
                    : resource === 'classrooms'
                      ? 'Nova sala'
                      : 'Nova aula'}
              </button>
            )}
            {resource === 'materials' && !uploading && (
              <button
                className="t-btn"
                disabled={busy || loading}
                onClick={() => void openUpload()}
              >
                <Plus size={16} />
                Anexar arquivo
              </button>
            )}
          </div>
        }
      />
      {error && (
        <div role="alert" className="mb-5 rounded-xl bg-red-50 p-4 text-sm text-red-700">
          {error}
          <button className="ml-3 underline" onClick={reload}>
            Tentar novamente
          </button>
        </div>
      )}
      {view === 'Visão geral' && overview && (
        <>
          <section className="mb-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              {
                title: 'Escolas',
                value: overview.schools,
                detail: 'Instituições cadastradas',
                icon: Building2,
                target: 'Escolas',
              },
              {
                title: 'Usuários',
                value: overview.users,
                detail: `${overview.activeUsers} ativos · ${overview.blockedUsers} bloqueados`,
                icon: Users,
                target: 'Usuários',
              },
              {
                title: 'Salas',
                value: overview.classrooms,
                detail: 'Salas de aula na plataforma',
                icon: LayoutGrid,
                target: 'Salas',
              },
              {
                title: 'Aulas',
                value: overview.lessons,
                detail: `${overview.liveLessons} em andamento`,
                icon: Video,
                target: 'Aulas',
              },
            ].map((card) => (
              <button
                key={card.title}
                onClick={() => navigate(card.target)}
                className="t-card p-6 text-left transition hover:border-blue-300"
              >
                <div className="mb-5 flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-500">{card.title}</span>
                  <span className="rounded-xl bg-blue-50 p-3 text-primary">
                    <card.icon size={22} />
                  </span>
                </div>
                <strong className="text-4xl font-bold tracking-tight">
                  {card.value.toLocaleString('pt-BR')}
                </strong>
                <p className="mt-2 text-xs text-slate-500">{card.detail}</p>
              </button>
            ))}
          </section>
          <div className="grid gap-5 lg:grid-cols-2">
            <section className="t-card p-6">
              <h2 className="mb-5 text-lg font-bold">Pessoas da rede</h2>
              {[
                { role: 'PROFESSOR', value: overview.teachers },
                { role: 'ALUNO', value: overview.students },
                { role: 'ADMIN', value: overview.admins },
              ].map((item) => (
                <button
                  key={item.role}
                  onClick={() => {
                    navigate('Usuários')
                    setRole(item.role)
                  }}
                  className="flex w-full items-center justify-between border-b border-slate-100 py-4 text-sm last:border-0"
                >
                  <span>{roleLabels[item.role as keyof typeof roleLabels]}</span>
                  <strong className="rounded-lg bg-slate-50 px-3 py-1 text-primary">
                    {item.value}
                  </strong>
                </button>
              ))}
            </section>
            <section className="t-card p-6">
              <ShieldCheck className="mb-4 text-primary" size={28} />
              <h2 className="text-lg font-bold">Gestão da plataforma</h2>
              <p className="my-3 text-sm leading-relaxed text-slate-500">
                Organize escolas, atribua professores às salas e controle o acesso de cada usuário.
                Alterações de acesso encerram as sessões anteriores da conta.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <button className="t-btn" onClick={() => navigate('Usuários')}>
                  Gerenciar usuários
                </button>
                <button className="t-btn-secondary" onClick={() => navigate('Materiais')}>
                  {overview.materials} materiais
                </button>
              </div>
            </section>
          </div>
        </>
      )}
      {view === 'Minha conta' && (
        <section className="t-card max-w-2xl space-y-4 p-6">
          <ShieldCheck className="text-primary" />
          <h2 className="text-lg font-bold">{user.name}</h2>
          <p className="text-sm text-slate-500">{user.email}</p>
          <span className="t-badge">Administrador</span>
          <p className="text-sm text-slate-500">
            Seu acesso inclui escolas, usuários, salas, aulas e materiais de toda a plataforma.
          </p>
          <button
            className="t-btn-secondary"
            onClick={() => {
              navigate('Usuários')
              setQuery(user.email)
            }}
          >
            Gerenciar minha conta
          </button>
        </section>
      )}
      {resource && !uploading && (
        <>
          <section className="mb-5 flex flex-wrap gap-3">
            <div className="min-w-56 flex-1">
              <SearchInput
                value={query}
                onChange={(value) => {
                  setQuery(value)
                  setPage(1)
                  setList(null)
                }}
                placeholder={
                  resource === 'users' ? 'Buscar por nome ou e-mail' : 'Buscar pelo nome'
                }
              />
            </div>
            {resource !== 'schools' && (
              <select
                aria-label="Filtrar por escola"
                className="t-input !w-auto"
                value={schoolId}
                onChange={(event) => {
                  setSchoolId(event.target.value)
                  setPage(1)
                  setList(null)
                }}
              >
                <option value="">Todas as escolas</option>
                {options.schools.map((school) => (
                  <option key={school.id} value={school.id}>
                    {school.name}
                  </option>
                ))}
              </select>
            )}
            {resource === 'users' && (
              <>
                <select
                  aria-label="Filtrar por perfil"
                  className="t-input !w-auto"
                  value={role}
                  onChange={(event) => {
                    setRole(event.target.value)
                    setPage(1)
                    setList(null)
                  }}
                >
                  <option value="">Todos os perfis</option>
                  {Object.entries(roleLabels).map(([value, label]) => (
                    <option value={value} key={value}>
                      {label}
                    </option>
                  ))}
                </select>
                <select
                  aria-label="Filtrar por situação"
                  className="t-input !w-auto"
                  value={active}
                  onChange={(event) => {
                    setActive(event.target.value)
                    setPage(1)
                    setList(null)
                  }}
                >
                  <option value="">Todas as situações</option>
                  <option value="true">Ativos</option>
                  <option value="false">Bloqueados</option>
                </select>
              </>
            )}
          </section>
          {!loading && !error && resource === 'users' && (
            <Table headers={['Usuário', 'Perfil', 'Escola', 'Situação', 'Ações']}>
              {(items as AdminEntities['users'][]).map((item) => (
                <tr key={item.id}>
                  <td>
                    <strong>{item.name}</strong>
                    <p className="mt-1 text-xs text-slate-500">{item.email}</p>
                  </td>
                  <td>
                    {roleLabels[item.role]}
                    <p className="mt-1 text-xs text-slate-500">
                      {item._count.classroomsOwned} salas · {item._count.memberships} participações
                    </p>
                  </td>
                  <td>{item.school?.name ?? 'Sem vínculo'}</td>
                  <td>
                    <span className={item.isActive ? 't-badge' : 't-badge-neutral'}>
                      {item.isActive ? 'Ativo' : 'Bloqueado'}
                    </span>
                  </td>
                  <td>
                    <div className="flex gap-1">
                      <Action
                        label={`Editar ${item.name}`}
                        onClick={() => setEditor({ kind: 'users', item })}
                      >
                        <Pencil size={16} />
                      </Action>
                      <Action
                        label={`Redefinir senha de ${item.name}`}
                        onClick={() => setEditor({ kind: 'password', item })}
                      >
                        <KeyRound size={16} />
                      </Action>
                      <Action
                        label={item.isActive ? `Bloquear ${item.name}` : `Reativar ${item.name}`}
                        disabled={item.id === user.id}
                        onClick={() => {
                          setActionError('')
                          setConfirmation({
                            title: `${item.isActive ? 'Bloquear' : 'Reativar'} ${item.name}?`,
                            description: item.isActive
                              ? 'A conta perderá o acesso imediatamente. Seus dados serão preservados.'
                              : 'A conta poderá entrar novamente usando a senha atual.',
                            label: item.isActive ? 'Bloquear conta' : 'Reativar conta',
                            action: () => adminApi.status(item.id, !item.isActive),
                          })
                        }}
                      >
                        {item.isActive ? <Ban size={16} /> : <CheckCircle size={16} />}
                      </Action>
                      <Action
                        label={`Excluir ${item.name}`}
                        danger
                        disabled={item.id === user.id}
                        onClick={() => remove('users', item.id, item.name)}
                      >
                        <Trash2 size={16} />
                      </Action>
                    </div>
                  </td>
                </tr>
              ))}
            </Table>
          )}
          {!loading && !error && resource === 'schools' && (
            <Table headers={['Escola', 'Localização', 'Usuários', 'Salas', 'Ações']}>
              {(items as AdminEntities['schools'][]).map((item) => (
                <tr key={item.id}>
                  <td>
                    <strong>{item.name}</strong>
                  </td>
                  <td>{[item.city, item.state].filter(Boolean).join(' / ') || 'Não informada'}</td>
                  <td>
                    <button
                      className="text-primary underline"
                      onClick={() => {
                        navigate('Usuários')
                        setSchoolId(item.id)
                      }}
                    >
                      {item._count.users}
                    </button>
                  </td>
                  <td>
                    <button
                      className="text-primary underline"
                      onClick={() => {
                        navigate('Salas')
                        setSchoolId(item.id)
                      }}
                    >
                      {item._count.classrooms}
                    </button>
                  </td>
                  <td>
                    <div className="flex gap-1">
                      <Action
                        label={`Editar ${item.name}`}
                        onClick={() => setEditor({ kind: 'schools', item })}
                      >
                        <Pencil size={16} />
                      </Action>
                      <Action
                        label={`Excluir ${item.name}`}
                        danger
                        onClick={() => remove('schools', item.id, item.name)}
                      >
                        <Trash2 size={16} />
                      </Action>
                    </div>
                  </td>
                </tr>
              ))}
            </Table>
          )}
          {!loading && !error && resource === 'classrooms' && (
            <Table headers={['Sala', 'Professor', 'Escola', 'Atividade', 'Ações']}>
              {(items as AdminEntities['classrooms'][]).map((item) => (
                <tr key={item.id}>
                  <td>
                    <strong>{item.name}</strong>
                    <p className="mt-1 font-mono text-xs text-slate-500">{item.code}</p>
                  </td>
                  <td>{item.teacher.name}</td>
                  <td>{item.school?.name ?? 'Sem vínculo'}</td>
                  <td>
                    {item._count.members} participantes
                    <p className="text-xs text-slate-500">
                      {item._count.lessons} aulas · {item._count.materials} materiais
                    </p>
                  </td>
                  <td>
                    <div className="flex gap-1">
                      <Action
                        label={`Editar ${item.name}`}
                        onClick={() => setEditor({ kind: 'classrooms', item })}
                      >
                        <Pencil size={16} />
                      </Action>
                      <Action
                        label={`Participantes de ${item.name}`}
                        onClick={() => setMembers(item)}
                      >
                        <Users size={16} />
                      </Action>
                      <Action
                        label={`Excluir ${item.name}`}
                        danger
                        onClick={() => remove('classrooms', item.id, item.name)}
                      >
                        <Trash2 size={16} />
                      </Action>
                    </div>
                  </td>
                </tr>
              ))}
            </Table>
          )}
          {!loading && !error && resource === 'lessons' && (
            <Table headers={['Aula', 'Sala', 'Professor', 'Situação', 'Ações']}>
              {(items as AdminEntities['lessons'][]).map((item) => (
                <tr key={item.id}>
                  <td>
                    <button
                      className="text-left font-semibold text-primary hover:underline"
                      onClick={() => setPreviewLesson(item.id)}
                    >
                      {item.title}
                    </button>
                    <p className="mt-1 text-xs text-slate-500">
                      {new Date(item.createdAt).toLocaleDateString('pt-BR')}
                    </p>
                  </td>
                  <td>{item.classroom.name}</td>
                  <td>{item.teacher.name}</td>
                  <td>
                    <span
                      className={item.status === 'EM_ANDAMENTO' ? 't-badge' : 't-badge-neutral'}
                    >
                      {lessonLabels[item.status]}
                    </span>
                  </td>
                  <td>
                    <div className="flex gap-1">
                      <Action
                        label={`Editar ${item.title}`}
                        onClick={() => setEditor({ kind: 'lessons', item })}
                      >
                        <Pencil size={16} />
                      </Action>
                      <Action
                        label={`Excluir ${item.title}`}
                        danger
                        onClick={() => remove('lessons', item.id, item.title)}
                      >
                        <Trash2 size={16} />
                      </Action>
                    </div>
                  </td>
                </tr>
              ))}
            </Table>
          )}
          {!loading && !error && resource === 'materials' && (
            <Table headers={['Arquivo', 'Sala / aula', 'Enviado por', 'Ações']}>
              {(items as AdminEntities['materials'][]).map((item) => (
                <tr key={item.id}>
                  <td>
                    <strong className="break-all">{item.name}</strong>
                    <p className="mt-1 text-xs text-slate-500">{item.type}</p>
                  </td>
                  <td>
                    {item.classroom?.name ?? item.lesson?.classroom.name ?? 'Sem vínculo'}
                    <p className="text-xs text-slate-500">
                      {item.lesson?.title ?? 'Material da sala'}
                    </p>
                  </td>
                  <td>{item.uploadedBy.name}</td>
                  <td>
                    <div className="flex gap-1">
                      <a
                        className="t-icon text-primary"
                        aria-label={`Baixar ${item.name}`}
                        href={`${AUTH_API_BASE}/education/materials/${encodeURIComponent(item.id)}/download`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <Download size={16} />
                      </a>
                      <Action
                        label={`Remover ${item.name}`}
                        danger
                        onClick={() => remove('materials', item.id, item.name)}
                      >
                        <Trash2 size={16} />
                      </Action>
                    </div>
                  </td>
                </tr>
              ))}
            </Table>
          )}
          {!loading && !error && !items.length && (
            <div className="mt-5">
              <Empty text="Nenhum registro encontrado. Ajuste os filtros ou adicione um novo cadastro." />
            </div>
          )}
          {list && !loading && !error && (
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500">
              <span>
                {list.total} registros · Página {list.page} de{' '}
                {Math.max(1, Math.ceil(list.total / list.pageSize))}
              </span>
              <div className="flex gap-2">
                <button
                  className="t-btn-secondary"
                  disabled={page <= 1}
                  onClick={() => setPage((value) => value - 1)}
                >
                  Anterior
                </button>
                <button
                  className="t-btn-secondary"
                  disabled={page * list.pageSize >= list.total}
                  onClick={() => setPage((value) => value + 1)}
                >
                  Próxima
                </button>
              </div>
            </div>
          )}
        </>
      )}
      {loading && (
        <p role="status" className="py-8 text-sm text-slate-500">
          Carregando dados da plataforma…
        </p>
      )}
      {uploading && (
        <>
          <button
            className="t-btn-secondary mb-5"
            onClick={() => {
              setUploading(false)
              reload()
            }}
          >
            Voltar para todos os materiais
          </button>
          <Materials />
        </>
      )}
      {editor && (
        <AdminEditor
          key={`${editor.kind}-${editor.item?.id ?? 'new'}`}
          editor={editor}
          options={options}
          currentUserId={user.id}
          onClose={() => setEditor(null)}
          onSaved={saved}
        />
      )}
      {previewLesson && (
        <AdminLessonPreview id={previewLesson} onClose={() => setPreviewLesson(null)} />
      )}
      {members && (
        <AdminMembers room={members} onClose={() => setMembers(null)} onChanged={reload} />
      )}
      {confirmation && (
        <Modal
          title={confirmation.title}
          onClose={() => {
            if (!busy) setConfirmation(null)
          }}
        >
          <p className="mb-5 text-sm leading-relaxed text-slate-600">{confirmation.description}</p>
          {actionError && (
            <p role="alert" className="mb-5 text-sm text-red-700">
              {actionError}
            </p>
          )}
          <div className="flex justify-end gap-3">
            <button
              className="t-btn-secondary"
              disabled={busy}
              onClick={() => setConfirmation(null)}
            >
              Cancelar
            </button>
            <button className="t-btn-danger" disabled={busy} onClick={() => void confirm()}>
              {busy ? 'Aguarde…' : confirmation.label}
            </button>
          </div>
        </Modal>
      )}
    </DashboardShell>
  )
}
