import { randomBytes } from 'node:crypto'
import { prisma } from '../config/prisma'
import type { Prisma } from '../generated/prisma/client'
import { RoleSchema } from '../schemas/Enums.schema'
import { AppError } from '../middlewares/error.middleware'
import { hashPassword } from '../utils/hash'
import type {
  AdminQuery,
  AdminUserInput,
  AdminSchoolInput,
  AdminClassroomInput,
  AdminLessonInput,
} from '../schemas/Admin.schema'

const pageSize = 25
const userSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  isActive: true,
  schoolId: true,
  createdAt: true,
  school: { select: { id: true, name: true } },
  teacherProfile: { select: { discipline: true } },
  studentProfile: { select: { registrationNumber: true } },
  _count: { select: { memberships: true, classroomsOwned: true } },
} satisfies Prisma.UserSelect
const schoolInclude = {
  _count: { select: { users: { where: { role: { in: RoleSchema.options } } }, classrooms: true } },
} as const
const classroomInclude = {
  teacher: { select: { id: true, name: true } },
  school: { select: { id: true, name: true } },
  _count: { select: { members: true, lessons: true, materials: true } },
} as const
const contains = (value: string) => ({ contains: value, mode: 'insensitive' as const })
const paging = (query: AdminQuery) => ({ skip: (query.page - 1) * pageSize, take: pageSize })
const result = <T>(items: T[], total: number, query: AdminQuery) => ({
  items,
  total,
  page: query.page,
  pageSize,
})

async function write<T>(actorId: string, action: (tx: Prisma.TransactionClient) => Promise<T>) {
  try {
    return await prisma.$transaction(
      async (tx) => {
        const actor = await tx.user.findUnique({
          where: { id: actorId },
          select: { role: true, isActive: true },
        })
        if (!actor?.isActive || actor.role !== 'ADMIN')
          throw new AppError('Acesso restrito à administração', 403)
        return action(tx)
      },
      { isolationLevel: 'Serializable', timeout: 15000 },
    )
  } catch (error) {
    const code = (error as { code?: string }).code
    if (code === 'P2002')
      throw new AppError(
        'Já existe um registro com estes dados. Verifique o e-mail ou código.',
        409,
      )
    if (code === 'P2025') throw new AppError('Registro não encontrado', 404)
    if (code === 'P2003')
      throw new AppError('O registro possui vínculos. Atualize os vínculos antes de excluir.', 409)
    if (code === 'P2034')
      throw new AppError(
        'Os dados foram alterados por outra operação. Atualize e tente novamente.',
        409,
      )
    throw error
  }
}
async function school(tx: Prisma.TransactionClient, id: string | null) {
  if (!id) return null
  const found = await tx.school.findUnique({ where: { id } })
  if (!found) throw new AppError('Escola não encontrada', 400)
  return found
}
async function protectUser(
  tx: Prisma.TransactionClient,
  actorId: string,
  id: string,
  removesAdmin: boolean,
) {
  const user = await tx.user.findUnique({ where: { id } })
  if (!user) throw new AppError('Usuário não encontrado', 404)
  if (removesAdmin && actorId === id)
    throw new AppError('Você não pode remover seu próprio acesso administrativo', 400)
  if (
    removesAdmin &&
    user.role === 'ADMIN' &&
    user.isActive &&
    (await tx.user.count({ where: { role: 'ADMIN', isActive: true } })) <= 1
  )
    throw new AppError('Mantenha ao menos um administrador ativo', 409)
  return user
}
async function ensureTeacher(tx: Prisma.TransactionClient, id: string) {
  const teacher = await tx.user.findFirst({ where: { id, role: 'PROFESSOR', isActive: true } })
  if (!teacher) throw new AppError('Selecione um professor ativo', 400)
}

export const adminService = {
  async overview() {
    const [
      schools,
      users,
      activeUsers,
      teachers,
      students,
      admins,
      classrooms,
      lessons,
      liveLessons,
      materials,
    ] = await Promise.all([
      prisma.school.count(),
      prisma.user.count({ where: { role: { in: RoleSchema.options } } }),
      prisma.user.count({ where: { isActive: true, role: { in: RoleSchema.options } } }),
      prisma.user.count({ where: { role: 'PROFESSOR' } }),
      prisma.user.count({ where: { role: 'ALUNO' } }),
      prisma.user.count({ where: { role: 'ADMIN' } }),
      prisma.classroom.count(),
      prisma.lesson.count(),
      prisma.lesson.count({ where: { status: 'EM_ANDAMENTO' } }),
      prisma.material.count(),
    ])
    return {
      schools,
      users,
      activeUsers,
      blockedUsers: users - activeUsers,
      teachers,
      students,
      admins,
      classrooms,
      lessons,
      liveLessons,
      materials,
    }
  },
  async options() {
    const [schools, teachers, classrooms] = await Promise.all([
      prisma.school.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } }),
      prisma.user.findMany({
        where: { role: 'PROFESSOR', isActive: true },
        select: { id: true, name: true, schoolId: true },
        orderBy: { name: 'asc' },
      }),
      prisma.classroom.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } }),
    ])
    return { schools, teachers, classrooms }
  },
  async users(query: AdminQuery) {
    const where: Prisma.UserWhereInput = {
      ...(query.q ? { OR: [{ name: contains(query.q) }, { email: contains(query.q) }] } : {}),
      role: query.role ?? { in: RoleSchema.options },
      schoolId: query.schoolId,
      isActive: query.active === undefined ? undefined : query.active === 'true',
    }
    const [items, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: userSelect,
        orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
        ...paging(query),
      }),
      prisma.user.count({ where }),
    ])
    return result(items, total, query)
  },
  async schools(query: AdminQuery) {
    const where = query.q ? { OR: [{ name: contains(query.q) }, { city: contains(query.q) }] } : {}
    const [items, total] = await Promise.all([
      prisma.school.findMany({
        where,
        include: schoolInclude,
        orderBy: [{ name: 'asc' }, { id: 'asc' }],
        ...paging(query),
      }),
      prisma.school.count({ where }),
    ])
    return result(items, total, query)
  },
  async classrooms(query: AdminQuery) {
    const where = {
      ...(query.q ? { OR: [{ name: contains(query.q) }, { code: contains(query.q) }] } : {}),
      schoolId: query.schoolId,
    }
    const [items, total] = await Promise.all([
      prisma.classroom.findMany({
        where,
        include: classroomInclude,
        orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
        ...paging(query),
      }),
      prisma.classroom.count({ where }),
    ])
    return result(items, total, query)
  },
  async lessons(query: AdminQuery) {
    const where = {
      ...(query.q ? { title: contains(query.q) } : {}),
      ...(query.schoolId ? { classroom: { schoolId: query.schoolId } } : {}),
    }
    const [items, total] = await Promise.all([
      prisma.lesson.findMany({
        where,
        select: {
          id: true,
          title: true,
          status: true,
          createdAt: true,
          classroom: { select: { name: true } },
          teacher: { select: { name: true } },
          _count: { select: { materials: true } },
        },
        orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
        ...paging(query),
      }),
      prisma.lesson.count({ where }),
    ])
    return result(items, total, query)
  },
  async materials(query: AdminQuery) {
    const where: Prisma.MaterialWhereInput = {
      ...(query.q ? { name: contains(query.q) } : {}),
      ...(query.schoolId
        ? {
            OR: [
              { classroom: { schoolId: query.schoolId } },
              { classroomId: null, lesson: { classroom: { schoolId: query.schoolId } } },
            ],
          }
        : {}),
    }
    const [items, total] = await Promise.all([
      prisma.material.findMany({
        where,
        select: {
          id: true,
          name: true,
          type: true,
          createdAt: true,
          classroom: { select: { name: true } },
          lesson: { select: { title: true, classroom: { select: { name: true } } } },
          uploadedBy: { select: { name: true } },
        },
        orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
        ...paging(query),
      }),
      prisma.material.count({ where }),
    ])
    return result(items, total, query)
  },
  saveSchool(actorId: string, id: string | undefined, data: AdminSchoolInput) {
    return write(actorId, (tx) =>
      id
        ? tx.school.update({ where: { id }, data, include: schoolInclude })
        : tx.school.create({ data, include: schoolInclude }),
    )
  },
  deleteSchool(actorId: string, id: string) {
    return write(actorId, async (tx) => {
      if (
        (await tx.user.count({ where: { schoolId: id } })) ||
        (await tx.classroom.count({ where: { schoolId: id } }))
      )
        throw new AppError('Reatribua os usuários e salas antes de excluir a escola', 409)
      await tx.school.delete({ where: { id } })
    })
  },
  async saveUser(actorId: string, id: string | undefined, data: AdminUserInput) {
    if (!id && !data.password) throw new AppError('Senha é obrigatória para criar uma conta', 400)
    if (id && data.password)
      throw new AppError('Use a ação Redefinir senha para alterar a senha', 400)
    const passwordHash = data.password ? await hashPassword(data.password) : undefined
    return write(actorId, async (tx) => {
      const previous = id ? await protectUser(tx, actorId, id, data.role !== 'ADMIN') : null
      if (
        previous?.role === 'PROFESSOR' &&
        data.role !== 'PROFESSOR' &&
        ((await tx.classroom.count({ where: { teacherId: id } })) ||
          (await tx.lesson.count({ where: { teacherId: id } })))
      )
        throw new AppError('Transfira as salas e aulas antes de alterar o perfil do professor', 409)
      const duplicate = await tx.user.findFirst({
        where: {
          email: { equals: data.email, mode: 'insensitive' },
          ...(id ? { NOT: { id } } : {}),
        },
        select: { id: true },
      })
      if (duplicate) throw new AppError('Este e-mail já está cadastrado', 409)
      const institution = await school(tx, data.schoolId)
      const fields = {
        name: data.name,
        email: data.email,
        role: data.role,
        schoolId: data.schoolId,
      }
      const user = id
        ? await tx.user.update({
            where: { id },
            data: {
              ...fields,
              ...(previous?.role !== data.role || previous?.email !== data.email
                ? { sessionVersion: { increment: 1 } }
                : {}),
            },
            select: { id: true },
          })
        : await tx.user.create({
            data: { ...fields, passwordHash: passwordHash! },
            select: { id: true },
          })
      if (data.role === 'PROFESSOR') {
        const profile = { discipline: data.discipline, institution: institution?.name ?? null }
        await tx.teacherProfile.upsert({
          where: { userId: user.id },
          create: { userId: user.id, ...profile },
          update: profile,
        })
      } else await tx.teacherProfile.deleteMany({ where: { userId: user.id } })
      if (data.role === 'ALUNO') {
        const profile = {
          registrationNumber: data.registrationNumber,
          institution: institution?.name ?? null,
        }
        await tx.studentProfile.upsert({
          where: { userId: user.id },
          create: { userId: user.id, ...profile },
          update: profile,
        })
      } else await tx.studentProfile.deleteMany({ where: { userId: user.id } })
      return tx.user.findUniqueOrThrow({ where: { id: user.id }, select: userSelect })
    })
  },
  setUserActive(actorId: string, id: string, isActive: boolean) {
    return write(actorId, async (tx) => {
      await protectUser(tx, actorId, id, !isActive)
      return tx.user.update({
        where: { id },
        data: { isActive, sessionVersion: { increment: 1 } },
        select: userSelect,
      })
    })
  },
  async resetPassword(actorId: string, id: string, password: string) {
    const passwordHash = await hashPassword(password)
    return write(actorId, async (tx) => {
      await tx.user.update({
        where: { id },
        data: { passwordHash, sessionVersion: { increment: 1 } },
        select: { id: true },
      })
    })
  },
  deleteUser(actorId: string, id: string) {
    return write(actorId, async (tx) => {
      await protectUser(tx, actorId, id, true)
      const user = await tx.user.findUniqueOrThrow({
        where: { id },
        select: {
          _count: {
            select: {
              classroomsOwned: true,
              lessonsAsTeacher: true,
              materials: true,
              glossaries: true,
              transcriptionSessions: true,
            },
          },
        },
      })
      if (Object.values(user._count).some((count) => count > 0))
        throw new AppError(
          'Esta conta possui conteúdo vinculado. Bloqueie o acesso ou transfira/remova os vínculos antes de excluir.',
          409,
        )
      await tx.user.delete({ where: { id } })
    })
  },
  saveClassroom(actorId: string, id: string | undefined, data: AdminClassroomInput) {
    return write(actorId, async (tx) => {
      await school(tx, data.schoolId)
      await ensureTeacher(tx, data.teacherId)
      if (id) {
        const room = await tx.classroom.update({ where: { id }, data, include: classroomInclude })
        await tx.lesson.updateMany({
          where: { classroomId: id },
          data: { teacherId: data.teacherId },
        })
        return room
      }
      return tx.classroom.create({
        data: { ...data, code: randomBytes(6).toString('hex').toUpperCase() },
        include: classroomInclude,
      })
    })
  },
  deleteClassroom(actorId: string, id: string) {
    return write(actorId, async (tx) => {
      const room = await tx.classroom.findUniqueOrThrow({
        where: { id },
        select: { _count: { select: { lessons: true, materials: true, glossaries: true } } },
      })
      if (Object.values(room._count).some((count) => count > 0))
        throw new AppError(
          'Remova as aulas, materiais e glossários vinculados antes de excluir a sala',
          409,
        )
      await tx.classroom.delete({ where: { id } })
    })
  },
  members(id: string) {
    return prisma.classroomMember.findMany({
      where: { classroomId: id },
      select: {
        userId: true,
        joinedAt: true,
        user: { select: { name: true, email: true, role: true, isActive: true } },
      },
      orderBy: { joinedAt: 'asc' },
    })
  },
  addMember(actorId: string, classroomId: string, userId: string) {
    return write(actorId, async (tx) => {
      const user = await tx.user.findFirst({ where: { id: userId, role: 'ALUNO', isActive: true } })
      if (!user) throw new AppError('Selecione um aluno ativo', 400)
      await tx.classroom.findUniqueOrThrow({ where: { id: classroomId } })
      return tx.classroomMember.upsert({
        where: { classroomId_userId: { classroomId, userId } },
        create: { classroomId, userId },
        update: {},
      })
    })
  },
  removeMember(actorId: string, classroomId: string, userId: string) {
    return write(actorId, (tx) => tx.classroomMember.deleteMany({ where: { classroomId, userId } }))
  },
  async lessonDetail(id: string) {
    const lesson = await prisma.lesson.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        status: true,
        classroom: { select: { name: true } },
        teacher: { select: { name: true } },
        summary: { select: { content: true } },
        transcriptionSessions: { select: { transcript: true }, orderBy: { startedAt: 'asc' } },
      },
    })
    if (!lesson) throw new AppError('Aula não encontrada', 404)
    return lesson
  },
  saveLesson(actorId: string, id: string | undefined, data: AdminLessonInput) {
    return write(actorId, async (tx) => {
      if (!id) {
        if (!data.classroomId) throw new AppError('Selecione uma sala para a aula', 400)
        const room = await tx.classroom.findUniqueOrThrow({ where: { id: data.classroomId } })
        await ensureTeacher(tx, room.teacherId)
        return tx.lesson.create({
          data: {
            title: data.title,
            status: data.status,
            classroomId: room.id,
            teacherId: room.teacherId,
            startedAt: data.status === 'EM_ANDAMENTO' ? new Date() : null,
            finishedAt: ['FINALIZADA', 'CANCELADA'].includes(data.status) ? new Date() : null,
          },
          select: { id: true },
        })
      }
      if (data.classroomId)
        throw new AppError('A sala de uma aula existente não pode ser alterada', 400)
      const previous = await tx.lesson.findUniqueOrThrow({ where: { id } })
      return tx.lesson.update({
        where: { id },
        data: {
          ...data,
          ...(previous.status !== data.status
            ? {
                startedAt:
                  data.status === 'EM_ANDAMENTO'
                    ? (previous.startedAt ?? new Date())
                    : previous.startedAt,
                finishedAt: ['FINALIZADA', 'CANCELADA'].includes(data.status)
                  ? (previous.finishedAt ?? new Date())
                  : null,
              }
            : {}),
        },
        select: { id: true },
      })
    })
  },
  deleteLesson(actorId: string, id: string) {
    return write(actorId, async (tx) => {
      if (await tx.material.count({ where: { lessonId: id } }))
        throw new AppError('Remova os materiais da aula antes de excluir', 409)
      await tx.lesson.delete({ where: { id } })
    })
  },
  deleteMaterial(actorId: string, id: string) {
    // The database record controls access. Retain the private file for recovery;
    // never delete arbitrary paths coming from historical material records.
    return write(actorId, async (tx) => {
      await tx.material.delete({ where: { id } })
    })
  },
}
