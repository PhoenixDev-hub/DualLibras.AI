import { useState, type FormEvent, type ReactNode } from 'react'
import { Modal } from '../../components/ui'
import { PASSWORD_HINT } from '../../validation/account'
import {
  adminApi,
  roleLabels,
  lessonLabels,
  type AdminUser,
  type AdminSchool,
  type AdminClassroom,
  type AdminLesson,
  type AdminOptions,
} from './adminApi'
import type { UserRole } from '../../services/authApi'
export type Editor =
  | { kind: 'users'; item?: AdminUser }
  | { kind: 'schools'; item?: AdminSchool }
  | { kind: 'classrooms'; item?: AdminClassroom }
  | { kind: 'lessons'; item?: AdminLesson }
  | { kind: 'password'; item: AdminUser }
function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="t-label">
      {label}
      {children}
    </label>
  )
}
const states = [
  'AC',
  'AL',
  'AP',
  'AM',
  'BA',
  'CE',
  'DF',
  'ES',
  'GO',
  'MA',
  'MT',
  'MS',
  'MG',
  'PA',
  'PB',
  'PR',
  'PE',
  'PI',
  'RJ',
  'RN',
  'RS',
  'RO',
  'RR',
  'SC',
  'SP',
  'SE',
  'TO',
]
export default function AdminEditor({
  editor,
  options,
  currentUserId,
  onClose,
  onSaved,
}: {
  editor: Editor
  options: AdminOptions
  currentUserId: string
  onClose: () => void
  onSaved: (signOut: boolean) => Promise<void>
}) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [role, setRole] = useState<UserRole>(
    editor.kind === 'users' ? (editor.item?.role ?? 'ALUNO') : 'ALUNO',
  )
  const names = {
    users: 'usuário',
    schools: 'escola',
    classrooms: 'sala',
    lessons: 'aula',
    password: 'senha',
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy) return
    const form = new FormData(event.currentTarget)
    const text = (key: string) => String(form.get(key) ?? '').trim()
    setBusy(true)
    setError('')
    try {
      let signOut = false
      if (editor.kind === 'password') {
        const password = String(form.get('password') ?? '')
        if (password !== form.get('confirmation')) throw new Error('As senhas não conferem.')
        await adminApi.password(editor.item.id, password)
        signOut = editor.item.id === currentUserId
      } else {
        let data: unknown
        if (editor.kind === 'users') {
          data = {
            name: text('name'),
            email: text('email'),
            role,
            schoolId: text('schoolId') || null,
            ...(editor.item ? {} : { password: String(form.get('password') ?? '') }),
            ...(role === 'PROFESSOR' ? { discipline: text('discipline') } : {}),
            ...(role === 'ALUNO' ? { registrationNumber: text('registrationNumber') } : {}),
          }
          signOut =
            editor.item?.id === currentUserId && text('email').toLowerCase() !== editor.item.email
        } else if (editor.kind === 'schools')
          data = { name: text('name'), city: text('city'), state: text('state') }
        else if (editor.kind === 'classrooms')
          data = {
            name: text('name'),
            description: text('description'),
            schoolId: text('schoolId') || null,
            teacherId: text('teacherId'),
          }
        else
          data = {
            title: text('title'),
            status: text('status'),
            ...(!editor.item ? { classroomId: text('classroomId') } : {}),
          }
        await adminApi.save(editor.kind, editor.item?.id, data)
      }
      await onSaved(signOut)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível salvar.')
    } finally {
      setBusy(false)
    }
  }
  const schoolValue =
    editor.kind === 'users' || editor.kind === 'classrooms' ? (editor.item?.schoolId ?? '') : ''
  return (
    <Modal
      title={
        editor.kind === 'password'
          ? `Redefinir senha: ${editor.item.name}`
          : `${editor.item ? 'Editar' : 'Adicionar'} ${names[editor.kind]}`
      }
      onClose={() => {
        if (!busy) onClose()
      }}
    >
      <form onSubmit={submit} className="space-y-4">
        <fieldset disabled={busy} className="space-y-4">
          {(editor.kind === 'users' ||
            editor.kind === 'schools' ||
            editor.kind === 'classrooms') && (
            <Field label="Nome">
              <input
                name="name"
                className="t-input"
                required
                minLength={2}
                maxLength={editor.kind === 'schools' ? 200 : 150}
                defaultValue={editor.item?.name}
              />
            </Field>
          )}
          {editor.kind === 'schools' && (
            <div className="grid grid-cols-[1fr_6rem] gap-4">
              <Field label="Cidade">
                <input
                  name="city"
                  className="t-input"
                  maxLength={100}
                  defaultValue={editor.item?.city ?? ''}
                />
              </Field>
              <Field label="UF">
                <select name="state" className="t-input" defaultValue={editor.item?.state ?? ''}>
                  <option value="">—</option>
                  {states.map((state) => (
                    <option key={state}>{state}</option>
                  ))}
                </select>
              </Field>
            </div>
          )}
          {editor.kind === 'users' && (
            <>
              <Field label="E-mail">
                <input
                  name="email"
                  type="email"
                  autoComplete="off"
                  required
                  maxLength={254}
                  className="t-input"
                  defaultValue={editor.item?.email}
                />
              </Field>
              <Field label="Perfil">
                <select
                  className="t-input"
                  value={role}
                  onChange={(event) => setRole(event.target.value as UserRole)}
                  disabled={editor.item?.id === currentUserId}
                >
                  {Object.entries(roleLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </Field>
              {role === 'PROFESSOR' && (
                <Field label="Disciplina">
                  <input
                    name="discipline"
                    required
                    maxLength={100}
                    className="t-input"
                    defaultValue={editor.item?.teacherProfile?.discipline ?? ''}
                  />
                </Field>
              )}
              {role === 'ALUNO' && (
                <Field label="Matrícula">
                  <input
                    name="registrationNumber"
                    required
                    maxLength={50}
                    className="t-input"
                    defaultValue={editor.item?.studentProfile?.registrationNumber ?? ''}
                  />
                </Field>
              )}
            </>
          )}
          {(editor.kind === 'users' || editor.kind === 'classrooms') && (
            <Field label="Escola">
              <select name="schoolId" className="t-input" defaultValue={schoolValue}>
                <option value="">Sem vínculo com escola</option>
                {options.schools.map((school) => (
                  <option key={school.id} value={school.id}>
                    {school.name}
                  </option>
                ))}
              </select>
            </Field>
          )}
          {editor.kind === 'classrooms' && (
            <>
              <Field label="Professor responsável">
                <select
                  name="teacherId"
                  className="t-input"
                  required
                  defaultValue={editor.item?.teacherId ?? ''}
                >
                  <option value="" disabled>
                    Selecione um professor ativo
                  </option>
                  {editor.item &&
                    !options.teachers.some((teacher) => teacher.id === editor.item?.teacherId) && (
                      <option value={editor.item.teacherId} disabled>
                        {editor.item.teacher.name} (conta bloqueada)
                      </option>
                    )}
                  {options.teachers.map((teacher) => (
                    <option key={teacher.id} value={teacher.id}>
                      {teacher.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Descrição">
                <textarea
                  name="description"
                  className="t-input"
                  rows={3}
                  maxLength={2000}
                  defaultValue={editor.item?.description ?? ''}
                />
              </Field>
              {editor.item && (
                <p className="text-sm text-slate-500">
                  Ao transferir a sala, suas aulas também passam para o novo professor.
                </p>
              )}
            </>
          )}
          {editor.kind === 'lessons' && (
            <>
              {!editor.item && (
                <Field label="Sala">
                  <select name="classroomId" required className="t-input" defaultValue="">
                    <option value="" disabled>
                      Selecione a sala
                    </option>
                    {options.classrooms.map((room) => (
                      <option key={room.id} value={room.id}>
                        {room.name}
                      </option>
                    ))}
                  </select>
                </Field>
              )}
              <Field label="Título">
                <input
                  name="title"
                  className="t-input"
                  required
                  maxLength={200}
                  defaultValue={editor.item?.title}
                />
              </Field>
              <Field label="Situação">
                <select
                  name="status"
                  className="t-input"
                  defaultValue={editor.item?.status ?? 'AGENDADA'}
                >
                  {Object.entries(lessonLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </Field>
            </>
          )}
          {(editor.kind === 'password' || (editor.kind === 'users' && !editor.item)) && (
            <>
              <Field label="Nova senha">
                <input
                  name="password"
                  type="password"
                  className="t-input"
                  autoComplete="new-password"
                  required
                  minLength={15}
                  maxLength={72}
                  aria-describedby="admin-password-hint"
                />
              </Field>
              <p id="admin-password-hint" className="text-xs text-slate-500">
                {PASSWORD_HINT}
              </p>
              {editor.kind === 'password' && (
                <>
                  <Field label="Confirmar senha">
                    <input
                      name="confirmation"
                      type="password"
                      className="t-input"
                      autoComplete="new-password"
                      required
                    />
                  </Field>
                  <p className="text-sm text-slate-500">
                    As sessões atuais desta conta serão encerradas.
                  </p>
                </>
              )}
            </>
          )}
        </fieldset>
        {error && (
          <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        )}
        <div className="flex justify-end gap-3">
          <button type="button" className="t-btn-secondary" disabled={busy} onClick={onClose}>
            Cancelar
          </button>
          <button className="t-btn" disabled={busy}>
            {busy ? 'Salvando…' : 'Salvar'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
