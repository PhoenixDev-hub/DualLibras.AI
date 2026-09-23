const { test } = require('node:test')
const assert = require('node:assert/strict')
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'
process.env.JWT_SECRET = 'admin-integration-test-secret'
process.env.DOTENV_CONFIG_QUIET = 'true'
const { createApp } = require('../dist/app')
const { prisma } = require('../dist/config/prisma')
const { signToken } = require('../dist/utils/jwt')
const { adminService } = require('../dist/services/admin.service')
const {
  adminUserSchema,
  adminSchoolSchema,
  adminClassroomSchema,
  adminQuerySchema,
} = require('../dist/schemas/Admin.schema')
const { comparePassword } = require('../dist/utils/hash')
const ADMIN = '35f4cd86-5193-4029-bb92-63f13a3f10a6'
const OTHER = '06397831-850f-405f-a23b-35d57d7a0c8c'
const SCHOOL = '05a57b29-dc5d-4cb7-bd8a-cb9cc3c3a181'
const ROOM = '79912fbe-c0ee-4d63-815a-af4948ac04a4'

test('admin routes enforce role, account state, session version and safe serialization', async (t) => {
  const users = [
    {
      id: ADMIN,
      name: 'Admin',
      email: 'admin@example.com',
      role: 'ADMIN',
      isActive: true,
      sessionVersion: 0,
      passwordHash: 'private-hash',
    },
    {
      id: OTHER,
      name: 'Professor',
      email: 'teacher@example.com',
      role: 'PROFESSOR',
      isActive: true,
      sessionVersion: 0,
      passwordHash: 'private-hash',
    },
  ]
  prisma.user.findFirst = async ({ where }) => users.find((user) => user.id === where.id) ?? null
  prisma.user.findUnique = async ({ where }) => users.find((user) => user.id === where.id) ?? null
  prisma.user.count = async () => 2
  for (const name of ['school', 'classroom', 'lesson', 'material'])
    prisma[name].count = async () => 0
  let listArgs
  prisma.user.findMany = async (args) => {
    listArgs = args
    return users.map((user) =>
      Object.fromEntries(
        Object.keys(args.select)
          .filter((key) => key in user)
          .map((key) => [key, user[key]]),
      ),
    )
  }
  const server = createApp().listen(0, '127.0.0.1')
  await new Promise((resolve) => server.once('listening', resolve))
  t.after(() => new Promise((resolve) => server.close(resolve)))
  t.after(() => prisma.$disconnect())
  const base = `http://127.0.0.1:${server.address().port}`
  const token = (id) => signToken({ sub: id, email: 'test@example.com', version: 0 })
  const request = (id, route, method = 'GET', body) =>
    fetch(base + route, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(id ? { Authorization: `Bearer ${token(id)}` } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  assert.equal((await request(null, '/admin/overview')).status, 401)
  for (const role of ['PROFESSOR', 'ALUNO']) {
    users[1].role = role
    for (const route of [
      '/admin/overview',
      '/admin/options',
      '/admin/users',
      '/admin/schools',
      '/admin/classrooms',
      '/admin/lessons',
      '/admin/materials',
    ])
      assert.equal((await request(OTHER, route)).status, 403, route)
    assert.equal((await request(OTHER, '/admin/schools', 'POST', { name: 'School' })).status, 403)
    assert.equal((await request(OTHER, `/admin/users/${ADMIN}`, 'DELETE')).status, 403)
  }
  users[0].isActive = false
  assert.equal((await request(ADMIN, '/admin/overview')).status, 401)
  users[0].isActive = true
  users[0].sessionVersion = 1
  assert.equal((await request(ADMIN, '/admin/overview')).status, 401)
  users[0].sessionVersion = 0
  assert.equal((await request(ADMIN, '/admin/overview')).status, 200)
  await request(ADMIN, '/admin/users')
  assert.deepEqual(listArgs.where.role, { in: ['PROFESSOR', 'ALUNO', 'ADMIN'] })
  assert.equal((await request(ADMIN, '/admin/users/not-a-uuid', 'DELETE')).status, 400)
  assert.equal((await request(ADMIN, '/admin/users?page=-1')).status, 400)
  assert.equal(
    (await request(ADMIN, '/admin/schools', 'POST', { name: 'School', state: 'ZZ' })).status,
    400,
  )
  const response = await request(
    ADMIN,
    `/admin/users?page=2&q=ana&role=ALUNO&active=false&schoolId=${SCHOOL}`,
  )
  assert.equal(response.status, 200)
  const payload = await response.json()
  assert.equal(payload.page, 2)
  assert.equal(payload.pageSize, 25)
  assert.equal(listArgs.skip, 25)
  assert.equal(listArgs.take, 25)
  assert.equal(listArgs.where.role, 'ALUNO')
  assert.equal(listArgs.where.isActive, false)
  assert.equal(listArgs.where.schoolId, SCHOOL)
  assert.equal(listArgs.where.OR[1].email.contains, 'ana')
  assert.equal(JSON.stringify(payload).includes('passwordHash'), false)
  assert.equal(JSON.stringify(payload).includes('sessionVersion'), false)
})

function fakeTransaction(tx) {
  prisma.$transaction = async (action, options) => {
    assert.equal(options.isolationLevel, 'Serializable')
    return action(tx)
  }
}
const actor = { id: ADMIN, role: 'ADMIN', isActive: true, sessionVersion: 0 }

test('self protection, last admin, blocking and immediate session revocation', async () => {
  const target = { id: OTHER, role: 'ADMIN', isActive: true, sessionVersion: 0 }
  let count = 1
  let updated
  fakeTransaction({
    user: {
      findUnique: async ({ where }) => (where.id === ADMIN ? actor : target),
      count: async () => count,
      update: async (args) => {
        updated = args
        return {}
      },
    },
  })
  await assert.rejects(
    adminService.setUserActive(ADMIN, ADMIN, false),
    (error) => error.statusCode === 400,
  )
  await assert.rejects(adminService.deleteUser(ADMIN, ADMIN), (error) => error.statusCode === 400)
  await assert.rejects(
    adminService.setUserActive(ADMIN, OTHER, false),
    (error) => error.statusCode === 409,
  )
  count = 2
  await adminService.setUserActive(ADMIN, OTHER, false)
  assert.equal(updated.data.isActive, false)
  assert.deepEqual(updated.data.sessionVersion, { increment: 1 })
  await adminService.setUserActive(ADMIN, OTHER, true)
  assert.equal(updated.data.isActive, true)
  assert.deepEqual(updated.data.sessionVersion, { increment: 1 })
  await adminService.resetPassword(ADMIN, OTHER, 'Uma senha administrativa 2026!')
  assert.notEqual(updated.data.passwordHash, 'Uma senha administrativa 2026!')
  assert.equal(
    await comparePassword('Uma senha administrativa 2026!', updated.data.passwordHash),
    true,
  )
  assert.deepEqual(updated.data.sessionVersion, { increment: 1 })
})

test('role changes require classroom transfer and school references must exist', async () => {
  fakeTransaction({
    user: {
      findUnique: async ({ where }) =>
        where.id === ADMIN ? actor : { id: OTHER, role: 'PROFESSOR', isActive: true },
    },
    classroom: { count: async () => 1 },
  })
  const input = adminUserSchema.parse({
    name: 'Novo aluno',
    email: 'novo@example.com',
    role: 'ALUNO',
    registrationNumber: '001',
    schoolId: null,
  })
  await assert.rejects(
    adminService.saveUser(ADMIN, OTHER, input),
    (error) => error.statusCode === 409,
  )
  fakeTransaction({
    user: { findUnique: async () => actor },
    school: { findUnique: async () => null },
  })
  await assert.rejects(
    adminService.saveClassroom(ADMIN, undefined, {
      name: 'Sala',
      description: '',
      teacherId: OTHER,
      schoolId: SCHOOL,
    }),
    (error) => error.statusCode === 400,
  )
})

test('user create/update normalizes data, hashes passwords, keeps profiles and roles consistent', async () => {
  const calls = []
  let stored
  fakeTransaction({
    user: {
      findUnique: async ({ where }) =>
        where.id === ADMIN
          ? actor
          : { id: OTHER, role: 'ALUNO', email: 'old@example.com', isActive: true },
      findFirst: async () => null,
      create: async ({ data }) => {
        stored = data
        return { id: OTHER }
      },
      update: async ({ data }) => {
        stored = data
        return { id: OTHER }
      },
      findUniqueOrThrow: async () => ({
        id: OTHER,
        name: stored.name,
        email: stored.email,
        role: stored.role,
      }),
    },
    school: { findUnique: async () => ({ id: SCHOOL, name: 'Escola Central' }) },
    teacherProfile: { upsert: async (args) => calls.push(args), deleteMany: async () => {} },
    studentProfile: {
      upsert: async (args) => calls.push(args),
      deleteMany: async () => calls.push('student-deleted'),
    },
  })
  const data = adminUserSchema.parse({
    name: '  Ana   Maria ',
    email: ' ANA@EXAMPLE.COM ',
    role: 'PROFESSOR',
    discipline: 'Matemática',
    schoolId: SCHOOL,
    password: 'Uma senha administrativa 2026!',
  })
  const result = await adminService.saveUser(ADMIN, undefined, data)
  assert.equal(result.name, 'Ana Maria')
  assert.equal(result.email, 'ana@example.com')
  assert.equal(await comparePassword(data.password, stored.passwordHash), true)
  assert.equal(calls[0].create.discipline, 'Matemática')
  assert.equal(calls[0].create.institution, 'Escola Central')
  assert.equal(calls[1], 'student-deleted')
  assert.equal(Object.hasOwn(result, 'passwordHash'), false)
  const { password, ...update } = data
  await adminService.saveUser(ADMIN, OTHER, update)
  assert.deepEqual(stored.sessionVersion, { increment: 1 })
  assert.equal(Object.hasOwn(stored, 'passwordHash'), false)
})

test('room ownership transfers its lessons and requires an active teacher', async () => {
  let activeTeacher = false
  let classroom
  let lessons
  fakeTransaction({
    user: {
      findUnique: async () => actor,
      findFirst: async ({ where }) => {
        assert.equal(where.role, 'PROFESSOR')
        assert.equal(where.isActive, true)
        return activeTeacher ? { id: OTHER } : null
      },
    },
    school: { findUnique: async () => ({ id: SCHOOL }) },
    classroom: {
      update: async (args) => {
        classroom = args
        return { id: ROOM }
      },
    },
    lesson: {
      updateMany: async (args) => {
        lessons = args
        return { count: 1 }
      },
    },
  })
  const data = { name: 'Sala transferida', description: '', schoolId: SCHOOL, teacherId: OTHER }
  await assert.rejects(
    adminService.saveClassroom(ADMIN, ROOM, data),
    (error) => error.statusCode === 400,
  )
  activeTeacher = true
  await adminService.saveClassroom(ADMIN, ROOM, data)
  assert.equal(classroom.data.teacherId, OTHER)
  assert.deepEqual(lessons, { where: { classroomId: ROOM }, data: { teacherId: OTHER } })
})

test('deletions preserve linked content and reject stale admin privileges', async () => {
  let deletes = 0
  fakeTransaction({
    user: {
      findUnique: async ({ where }) =>
        where.id === ADMIN ? actor : { id: OTHER, role: 'ALUNO', isActive: true },
      count: async () => 1,
      findUniqueOrThrow: async () => ({ _count: { materials: 1 } }),
      delete: async () => deletes++,
    },
    classroom: {
      count: async () => 0,
      findUniqueOrThrow: async () => ({ _count: { lessons: 2 } }),
      delete: async () => deletes++,
    },
    material: { count: async () => 1 },
    school: { delete: async () => deletes++ },
    lesson: { delete: async () => deletes++ },
  })
  await assert.rejects(
    adminService.deleteSchool(ADMIN, SCHOOL),
    (error) => error.statusCode === 409,
  )
  await assert.rejects(adminService.deleteUser(ADMIN, OTHER), (error) => error.statusCode === 409)
  await assert.rejects(
    adminService.deleteClassroom(ADMIN, ROOM),
    (error) => error.statusCode === 409,
  )
  await assert.rejects(adminService.deleteLesson(ADMIN, ROOM), (error) => error.statusCode === 409)
  assert.equal(deletes, 0)
  fakeTransaction({ user: { findUnique: async () => ({ role: 'PROFESSOR', isActive: true }) } })
  await assert.rejects(
    adminService.deleteMaterial(ADMIN, ROOM),
    (error) => error.statusCode === 403,
  )
})

test('admin input validation rejects privilege injection, retired roles and invalid data', () => {
  const valid = {
    name: 'Usuário',
    email: 'user@example.com',
    role: 'ALUNO',
    registrationNumber: '001',
  }
  for (const patch of [
    { role: 'SOCIEDADE' },
    { password: 'weak' },
    { isActive: true },
    { passwordHash: 'injected' },
    { sessionVersion: 0 },
    { registrationNumber: '  ' },
    { schoolId: 'invalid' },
  ])
    assert.equal(adminUserSchema.safeParse({ ...valid, ...patch }).success, false)
  assert.equal(adminSchoolSchema.safeParse({ name: ' ', state: 'XX' }).success, false)
  assert.equal(adminClassroomSchema.safeParse({ name: 'Sala', teacherId: 'x' }).success, false)
  assert.equal(adminQuerySchema.safeParse({ page: 0 }).success, false)
})

test('new lessons use the room teacher and existing lessons cannot change rooms', async () => {
  let created
  fakeTransaction({
    user: {
      findUnique: async () => actor,
      findFirst: async () => ({ id: OTHER, role: 'PROFESSOR', isActive: true }),
    },
    classroom: { findUniqueOrThrow: async () => ({ id: ROOM, teacherId: OTHER }) },
    lesson: {
      create: async (args) => {
        created = args.data
        return { id: SCHOOL }
      },
    },
  })
  await assert.rejects(
    adminService.saveLesson(ADMIN, undefined, { title: 'Aula', status: 'AGENDADA' }),
    (error) => error.statusCode === 400,
  )
  await adminService.saveLesson(ADMIN, undefined, {
    title: 'Aula nova',
    status: 'AGENDADA',
    classroomId: ROOM,
  })
  assert.equal(created.teacherId, OTHER)
  assert.equal(created.classroomId, ROOM)
  assert.equal(created.startedAt, null)
  assert.equal(created.finishedAt, null)
  await assert.rejects(
    adminService.saveLesson(ADMIN, SCHOOL, {
      title: 'Aula',
      status: 'AGENDADA',
      classroomId: ROOM,
    }),
    (error) => error.statusCode === 400,
  )
})
