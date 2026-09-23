const { test } = require('node:test')
const assert = require('node:assert/strict')
const { registerSchema, loginSchema } = require('../dist/schemas/Auth.schema')
const { UserCreateSchema, UserUpdateSchema } = require('../dist/schemas/User.schema')
const { validate } = require('../dist/middlewares/validate.middleware')
const valid = {
  name: '  Ana   D’Ávila  ',
  email: ' ANA@EXAMPLE.COM ',
  password: 'Uma frase exclusiva 2026!',
  role: 'ALUNO',
  registrationNumber: ' 001-A ',
}

test('normalizes identity fields without changing passwords', () => {
  const data = registerSchema.parse(valid)
  assert.equal(data.name, 'Ana D’Ávila')
  assert.equal(data.email, 'ana@example.com')
  assert.equal(data.registrationNumber, '001-A')
  assert.equal(data.password, valid.password)
  const spaced = '  uma frase longa e privada  '
  assert.equal(registerSchema.parse({ ...valid, password: spaced }).password, spaced)
})

test('rejects invalid names, emails, types and public admin registration', () => {
  for (const name of [
    '  ',
    '1',
    '12345',
    '<script>alert(1)</script>',
    'Ana\u200bMaria',
    'Ana\nMaria',
    'A'.repeat(151),
  ]) {
    assert.equal(registerSchema.safeParse({ ...valid, name }).success, false, name)
  }
  for (const email of [
    'x',
    'a@localhost',
    'a..b@example.com',
    'a.@example.com',
    'a b@example.com',
    'a@-example.com',
    `${'a'.repeat(65)}@example.com`,
  ]) {
    assert.equal(registerSchema.safeParse({ ...valid, email }).success, false, email)
  }
  for (const patch of [
    { name: null },
    { email: 123 },
    { password: [] },
    { role: 'ADMIN' },
    { role: 'other' },
  ]) {
    assert.equal(registerSchema.safeParse({ ...valid, ...patch }).success, false)
  }
})

test('requires profile fields and bounds optional text', () => {
  for (const patch of [
    { registrationNumber: '  ' },
    { role: 'PROFESSOR', discipline: ' ' },
    { institution: 'a'.repeat(151) },
    { discipline: 'a'.repeat(101) },
    { registrationNumber: 'a'.repeat(51) },
    { institution: 'School\nName' },
  ]) {
    assert.equal(registerSchema.safeParse({ ...valid, ...patch }).success, false)
  }
  assert.equal(
    registerSchema.safeParse({
      ...valid,
      role: 'PROFESSOR',
      discipline: 'Matemática',
      registrationNumber: undefined,
    }).success,
    true,
  )
})

test('password policy respects UTF-8 bcrypt boundaries and legacy login', () => {
  for (const password of [
    '12345678',
    ' '.repeat(15),
    'a'.repeat(20),
    'Abcdefghijklmno\0',
    'é'.repeat(35) + 'abc',
    'abc'.repeat(25),
  ]) {
    assert.equal(registerSchema.safeParse({ ...valid, password }).success, false)
  }
  assert.equal(registerSchema.safeParse({ ...valid, password: 'abcd'.repeat(18) }).success, true)
  assert.equal(
    registerSchema.safeParse({ ...valid, password: 'é'.repeat(34) + 'abcd' }).success,
    true,
  )
  assert.equal(
    loginSchema.parse({ email: valid.email, password: 'oldpass' }).email,
    'ana@example.com',
  )
  assert.equal(loginSchema.safeParse({ email: valid.email, password: '' }).success, false)
  assert.equal(
    loginSchema.safeParse({ email: valid.email, password: 'x'.repeat(1025) }).success,
    false,
  )
})

test('user creation and updates apply the same identity policy', () => {
  assert.equal(UserCreateSchema.parse(valid).email, 'ana@example.com')
  assert.equal(UserUpdateSchema.safeParse({ password: 'weak' }).success, false)
  assert.equal(UserUpdateSchema.safeParse({ name: ' ' }).success, false)
})

test('middleware rejects invalid inputs before controller and passes normalized data', () => {
  let calls = 0
  let status
  let body
  const res = {
    status(code) {
      status = code
      return this
    },
    json(data) {
      body = data
      return this
    },
  }
  const middleware = validate(registerSchema)
  middleware({ body: { ...valid, password: 'weak' } }, res, () => calls++)
  assert.equal(status, 400)
  assert.equal(calls, 0)
  assert.ok(body.details.password.length)
  assert.equal(JSON.stringify(body).includes('weak'), false)
  const req = { body: { ...valid, passwordHash: 'injected' } }
  middleware(req, res, () => calls++)
  assert.equal(calls, 1)
  assert.equal(req.body.email, 'ana@example.com')
  assert.equal(req.body.passwordHash, undefined)
})

// The frontend is absent in the standalone auth Docker build.
const fs = require('node:fs')
const path = require('node:path')
const browserRules = path.resolve(__dirname, '../../../client/src/validation/account.ts')
test(
  'browser and API validation rules remain identical',
  { skip: !fs.existsSync(browserRules) },
  () => {
    assert.equal(
      fs.readFileSync(browserRules, 'utf8'),
      fs.readFileSync(path.resolve(__dirname, '../src/validation/account.ts'), 'utf8'),
    )
  },
)

// Reject retired roles even when a caller bypasses the browser.
test('only classroom roles are accepted by public signup', () => {
  for (const role of ['SOCIEDADE', 'ADMIN', 'VISITANTE']) {
    assert.equal(registerSchema.safeParse({ ...valid, role }).success, false)
  }
  assert.equal(UserCreateSchema.safeParse({ ...valid, role: 'SOCIEDADE' }).success, false)
  assert.equal(UserUpdateSchema.safeParse({ role: 'SOCIEDADE' }).success, false)
})
