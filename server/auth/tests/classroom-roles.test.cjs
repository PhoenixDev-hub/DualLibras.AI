const { test } = require('node:test');
const assert = require('node:assert/strict');
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
process.env.JWT_SECRET = 'integration-test-only-secret';
process.env.DOTENV_CONFIG_QUIET = 'true';
const { prisma } = require('../dist/config/prisma');
const { authMiddleware } = require('../dist/middlewares/auth.middleware');
const { authService } = require('../dist/services/auth.service');
const { userService } = require('../dist/services/user.service');
const { dashboardService } = require('../dist/services/dashboard.service');
const { signToken } = require('../dist/utils/jwt');

test('retired roles cannot use existing sessions or login', async () => {
  const original = prisma.user.findFirst;
  const token = signToken({ sub: 'existing-user', email: 'test@example.com' });
  let status;
  let calls = 0;
  const res = { status(code) { status = code; return this; }, json() { return this; } };
  try {
    for (const role of ['SOCIEDADE', 'PROFESSOR', 'ALUNO', 'ADMIN']) {
      prisma.user.findFirst = async ({ where }) => {
        assert.deepEqual(where.role.in, ['PROFESSOR', 'ALUNO', 'ADMIN']);
        return where.role.in.includes(role) ? { id: 'existing-user', role } : null;
      };
      status = undefined;
      calls = 0;
      await authMiddleware({ headers: { authorization: `Bearer ${token}` } }, res, error => { assert.ifError(error); calls++; });
      assert.equal(calls, role === 'SOCIEDADE' ? 0 : 1);
      assert.equal(status, role === 'SOCIEDADE' ? 401 : undefined);
      if (role === 'SOCIEDADE') {
        await assert.rejects(authService.login({ email: 'test@example.com', password: 'old-password' }), error => error.statusCode === 401);
      }
    }
    prisma.user.findFirst = async () => null;
    calls = 0;
    await authMiddleware({ headers: { authorization: `Bearer ${token}` } }, res, () => calls++);
    assert.equal(calls, 0);
    assert.equal(status, 401);
  } finally {
    prisma.user.findFirst = original;
    await prisma.$disconnect();
  }
});

test('unknown roles never fall back to student permissions', () => {
  for (const role of ['SOCIEDADE', 'UNKNOWN', 'constructor', '__proto__']) {
    assert.throws(() => dashboardService.getAccess(role), error => error.statusCode === 403);
  }
  assert.equal(dashboardService.getAccess('ALUNO').capabilities.joinClass, true);
  assert.equal(dashboardService.getAccess('PROFESSOR').capabilities.createClass, true);
  assert.equal(dashboardService.getAccess('ADMIN').capabilities.createClass, true);
});

test('classroom user creation has no retired profile relation', async () => {
  const original = prisma.user.create;
  try {
    for (const role of ['PROFESSOR', 'ALUNO']) {
      prisma.user.create = async ({ data }) => {
        assert.equal(Object.hasOwn(data, 'societyProfile'), false);
        assert.equal(Boolean(data.teacherProfile), role === 'PROFESSOR');
        assert.equal(Boolean(data.studentProfile), role === 'ALUNO');
        return { id: 'new-user', ...data };
      };
      await userService.create({ name: 'Teste', email: 'test@example.com', passwordHash: 'hash', role, discipline: 'Matemática', registrationNumber: '001' });
    }
  } finally {
    prisma.user.create = original;
  }
});
