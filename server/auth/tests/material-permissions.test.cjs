const { test } = require('node:test')
const assert = require('node:assert/strict')
const { mkdtemp, readFile, readdir, rm, symlink } = require('node:fs/promises')
const path = require('node:path')
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'
process.env.JWT_SECRET = 'material-integration-test-secret'
process.env.DOTENV_CONFIG_QUIET = 'true'
const { createApp } = require('../dist/app')
const { prisma } = require('../dist/config/prisma')
const { env } = require('../dist/config/env')
const { signToken } = require('../dist/utils/jwt')

// Small relational query evaluator: exercise the Prisma filters against fixtures.
function matches(row, where) {
  if (!row) return false
  return Object.entries(where).every(([key, value]) => {
    if (key === 'OR') return value.some((branch) => matches(row, branch))
    if (value === null || typeof value !== 'object') return row[key] === value
    if ('in' in value) return value.in.includes(row[key])
    if ('some' in value) return row[key].some((item) => matches(item, value.some))
    return matches(row[key], value)
  })
}

test('attachments: classroom ownership, membership, uploads and private downloads', async (t) => {
  const directory = await mkdtemp(path.join(require('node:os').tmpdir(), 'material-permissions-'))
  const oldDirectory = env.materialUploadDir
  const oldLimit = env.materialMaxBytes
  env.materialUploadDir = directory
  const server = createApp().listen(0, '127.0.0.1')
  await new Promise((resolve) => server.once('listening', resolve))
  const base = `http://127.0.0.1:${server.address().port}`
  const originalFetch = global.fetch
  global.fetch = (url, init) =>
    String(url).startsWith(env.aiBackendUrl + '/materials/ingest')
      ? Promise.resolve({ ok: false })
      : originalFetch(url, init)
  t.after(async () => {
    global.fetch = originalFetch
    await new Promise((resolve) => server.close(resolve))
    env.materialUploadDir = oldDirectory
    env.materialMaxBytes = oldLimit
    await rm(directory, { recursive: true, force: true })
    await prisma.$disconnect()
  })

  const users = [
    { id: 'teacher', role: 'PROFESSOR' },
    { id: 'other-teacher', role: 'PROFESSOR' },
    { id: 'student', role: 'ALUNO' },
    { id: 'outsider', role: 'ALUNO' },
    { id: 'admin', role: 'ADMIN' },
  ]
  const room = {
    id: '6b484c0b-b9c1-4ab4-bd91-ea0f83a37463',
    teacherId: 'teacher',
    members: [{ userId: 'student' }, { userId: 'other-teacher' }],
    name: 'Sala',
    teacher: { name: 'Docente', teacherProfile: null },
    code: 'ABC',
    lessons: [],
  }
  room.members = room.members.map((member) => ({
    ...member,
    user: users.find((user) => user.id === member.userId),
    joinedAt: new Date(),
  }))
  const lesson = {
    id: '80468ca5-f321-4ed4-93dc-66f8753de2b3',
    classroomId: room.id,
    classroom: room,
  }
  const records = []
  const hydrate = (record) => ({
    ...record,
    classroom: record.classroomId === room.id ? room : null,
    lesson: record.lessonId === lesson.id ? lesson : null,
  })
  prisma.user.findFirst = async ({ where }) => users.find((user) => matches(user, where)) ?? null
  prisma.user.findUnique = async ({ where }) => users.find((user) => user.id === where.id) ?? null
  prisma.classroom.findMany = async ({ where }) => (matches(room, where) ? [room] : [])
  prisma.glossary.findMany = async () => []
  prisma.classroom.findFirst = async ({ where }) => (matches(room, where) ? room : null)
  prisma.lesson.findFirst = async ({ where }) => (matches(lesson, where) ? lesson : null)
  prisma.material.create = async ({ data }) => {
    const record = {
      id: `material-${records.length}`,
      createdAt: new Date(),
      lessonId: null,
      classroomId: null,
      ...data,
    }
    records.push(record)
    return record
  }
  prisma.material.findMany = async ({ where }) =>
    records.map(hydrate).filter((record) => matches(record, where))
  prisma.material.findFirst = async ({ where }) =>
    records.map(hydrate).find((record) => matches(record, where)) ?? null
  const request = (userId, route, method = 'GET', body) =>
    originalFetch(base + route, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(userId
          ? { Authorization: `Bearer ${signToken({ sub: userId, email: 'test@example.com' })}` }
          : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  const attachment = {
    filename: 'atividade.txt',
    contentBase64: Buffer.from('Atividade da turma').toString('base64'),
    classroomId: room.id,
  }

  assert.equal((await request(null, '/materials', 'POST', attachment)).status, 401)
  for (const user of ['student', 'outsider', 'other-teacher']) {
    assert.equal((await request(user, '/materials', 'POST', attachment)).status, 403, user)
    assert.equal(
      (await request(user, '/materials', 'POST', { ...attachment, lessonId: lesson.id })).status,
      403,
      user,
    )
  }
  assert.equal(records.length, 0)
  assert.deepEqual(await readdir(directory), [])

  for (const patch of [
    { classroomId: undefined },
    { filename: '../segredo.txt' },
    { filename: 'arquivo.exe' },
    { filename: 'constructor' },
    { filename: 'arquivo.' + 'a'.repeat(201) },
    { contentBase64: '' },
    { contentBase64: '!!!!' },
    { contentBase64: 'YQ==garbage' },
    { contentBase64: 'data:text/plain;base64,YQ=!' },
    { classroomId: 'c5249b5b-3115-48dc-bd50-8d6d8a346b9a', lessonId: lesson.id },
  ]) {
    assert.equal(
      (await request('teacher', '/materials', 'POST', { ...attachment, ...patch })).status,
      400,
      JSON.stringify(patch),
    )
  }
  assert.equal(records.length, 0)
  env.materialMaxBytes = 5
  const options = await (await request('teacher', '/materials/options')).json()
  assert.equal(options.maxBytes, 5)
  assert.deepEqual(options.extensions, ['.pdf', '.doc', '.docx', '.ppt', '.pptx', '.txt'])
  assert.equal((await request('teacher', '/materials', 'POST', attachment)).status, 400)
  env.materialMaxBytes = oldLimit

  const roomResponse = await request('teacher', '/materials', 'POST', attachment)
  assert.equal(roomResponse.status, 201)
  const roomUpload = await roomResponse.json()
  assert.equal(roomUpload.ai.sent, false)
  assert.equal(roomUpload.material.classroomId, room.id)
  assert.equal(roomUpload.material.url, `/education/materials/${roomUpload.material.id}/download`)
  assert.equal(JSON.stringify(roomUpload).includes(directory), false)
  assert.equal(await readFile(records[0].url, 'utf8'), 'Atividade da turma')
  const lessonResponse = await request('teacher', '/materials', 'POST', {
    ...attachment,
    classroomId: undefined,
    lessonId: lesson.id,
    contentBase64: 'data:text/plain;base64,' + attachment.contentBase64,
  })
  assert.equal(lessonResponse.status, 201)
  const lessonUpload = await lessonResponse.json()
  assert.equal(lessonUpload.material.lessonId, lesson.id)
  assert.equal(lessonUpload.material.classroomId, room.id)

  assert.equal((await request('admin', '/materials', 'POST', attachment)).status, 201)
  for (const user of ['teacher', 'student', 'other-teacher', 'outsider', 'admin']) {
    const allowed = ['teacher', 'student', 'other-teacher', 'admin'].includes(user)
    const list = await (await request(user, '/materials')).json()
    assert.equal(list.materials.length, allowed ? records.length : 0, user)
    const education = await (await request(user, '/education')).json()
    assert.equal(education.materials.length, allowed ? records.length : 0, user)
    for (const classroom of education.classrooms) {
      assert.equal(classroom.canAttachMaterials, user === 'teacher' || user === 'admin', user)
    }
    for (const record of records) {
      const response = await request(user, `/education/materials/${record.id}/download`)
      assert.equal(response.status, allowed ? 200 : 404, user)
      if (allowed) {
        assert.equal(await response.text(), 'Atividade da turma')
        assert.equal(response.headers.get('cache-control'), 'private, no-store')
        assert.equal(response.headers.get('x-content-type-options'), 'nosniff')
        assert.match(response.headers.get('content-disposition'), /^attachment;/)
      }
    }
  }
  // Leaving the room revokes both list and download, including an old uploader.
  records[0].uploadedById = 'student'
  room.members = []
  assert.equal((await (await request('student', '/materials')).json()).materials.length, 0)
  assert.equal(
    (await request('student', `/education/materials/${records[0].id}/download`)).status,
    404,
  )
  room.members = [{ userId: 'student' }]
  // Legacy lesson attachments inherit the same room audience.
  records[1].classroomId = null
  assert.equal(
    (await request('student', `/education/materials/${records[1].id}/download`)).status,
    200,
  )

  // A storage path or symlink must not expose files outside the upload directory.
  const savedUrl = records[0].url
  records[0].url = '/etc/passwd'
  assert.equal(
    (await request('teacher', `/education/materials/${records[0].id}/download`)).status,
    404,
  )
  const link = path.join(directory, 'outside.txt')
  await symlink('/etc/passwd', link)
  records[0].url = link
  assert.equal(
    (await request('teacher', `/education/materials/${records[0].id}/download`)).status,
    404,
  )
  records[0].url = savedUrl

  // If persistence fails, the newly written file is removed.
  const filesBefore = await readdir(directory)
  prisma.material.create = async () => {
    throw new Error('Simulated database failure')
  }
  const { materialService } = require('../dist/services/material.service')
  await assert.rejects(
    () => materialService.upload('teacher', 'PROFESSOR', attachment),
    /Simulated database failure/,
  )
  assert.deepEqual(await readdir(directory), filesBefore)
})
