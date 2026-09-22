import { useAutoRefresh } from '../../hooks/useAutoRefresh'
import { useEffect, useState } from 'react'
import { Modal, SearchInput } from '../../components/ui'
import { adminApi, type AdminClassroom, type AdminMember, type AdminUser } from './adminApi'
export default function AdminMembers({
  room,
  onClose,
  onChanged,
}: {
  room: AdminClassroom
  onClose: () => void
  onChanged: () => void
}) {
  const [members, setMembers] = useState<AdminMember[]>([])
  const [students, setStudents] = useState<AdminUser[]>([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [version, setVersion] = useState(0)
  useAutoRefresh(
    async (isCurrent) => {
      const [nextMembers, nextStudents] = await Promise.all([
        adminApi.members(room.id),
        adminApi.list('users', { q: query, role: 'ALUNO', active: 'true' }),
      ])
      if (!isCurrent()) return
      setMembers((current) =>
        JSON.stringify(current) === JSON.stringify(nextMembers) ? current : nextMembers,
      )
      setStudents((current) =>
        JSON.stringify(current) === JSON.stringify(nextStudents.items)
          ? current
          : nextStudents.items,
      )
    },
    { scope: JSON.stringify([room.id, query]) },
  )
  useEffect(() => {
    let active = true
    adminApi
      .members(room.id)
      .then((data) => {
        if (active) {
          setMembers(data)
          setLoading(false)
        }
      })
      .catch((err) => {
        if (active) {
          setError(err.message)
          setLoading(false)
        }
      })
    return () => {
      active = false
    }
  }, [room.id, version])
  useEffect(() => {
    let active = true
    const timer = window.setTimeout(() => {
      adminApi
        .list('users', { q: query, role: 'ALUNO', active: 'true' })
        .then((data) => {
          if (active) setStudents(data.items)
        })
        .catch((err) => {
          if (active) setError(err.message)
        })
    }, 250)
    return () => {
      active = false
      window.clearTimeout(timer)
    }
  }, [query])
  async function change(id: string, remove = false) {
    if (busy) return
    setBusy(true)
    setError('')
    try {
      if (remove) await adminApi.removeMember(room.id, id)
      else await adminApi.addMember(room.id, id)
      setVersion((value) => value + 1)
      onChanged()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível atualizar a sala.')
    } finally {
      setBusy(false)
    }
  }
  return (
    <Modal
      title={`Participantes · ${room.name}`}
      onClose={() => {
        if (!busy) onClose()
      }}
    >
      <p className="mb-5 text-sm text-slate-500">
        Professor responsável: {room.teacher.name}. Remover um participante encerra o acesso dele à
        sala e aos materiais.
      </p>
      {error && (
        <p role="alert" className="mb-4 text-sm text-red-700">
          {error}
        </p>
      )}
      {loading ? (
        <p role="status">Carregando participantes…</p>
      ) : (
        <ul className="mb-6 divide-y divide-slate-100">
          {members.map((member) => (
            <li className="flex items-center justify-between gap-3 py-3" key={member.userId}>
              <div>
                <strong className="text-sm">{member.user.name}</strong>
                <p className="text-xs text-slate-500">
                  {member.user.email}
                  {!member.user.isActive && ' · Bloqueado'}
                </p>
              </div>
              <button
                disabled={busy}
                className="t-btn-danger"
                onClick={() => void change(member.userId, true)}
              >
                Remover
              </button>
            </li>
          ))}
          {!members.length && (
            <li className="text-sm text-slate-500">Nenhum participante cadastrado.</li>
          )}
        </ul>
      )}
      <h3 className="mb-3 font-semibold">Adicionar aluno</h3>
      <SearchInput
        value={query}
        onChange={setQuery}
        placeholder="Buscar aluno pelo nome ou e-mail"
      />
      <ul className="mt-3 max-h-64 overflow-auto divide-y divide-slate-100">
        {students
          .filter((student) => !members.some((member) => member.userId === student.id))
          .map((student) => (
            <li key={student.id} className="flex items-center justify-between gap-3 py-3">
              <div>
                <strong className="text-sm">{student.name}</strong>
                <p className="text-xs text-slate-500">{student.email}</p>
              </div>
              <button
                className="t-btn-secondary"
                disabled={busy || loading}
                onClick={() => void change(student.id)}
              >
                Adicionar
              </button>
            </li>
          ))}
      </ul>
      <p className="mt-3 text-xs text-slate-500">
        Busca entre alunos ativos. Refine o nome ou e-mail para localizar a conta desejada.
      </p>
    </Modal>
  )
}
