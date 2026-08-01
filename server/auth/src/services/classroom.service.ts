import { prisma } from '../config/prisma';
import { AppError } from '../middlewares/error.middleware';
import type { CreateClassroomInput } from '../schemas/classroom.schema';

function normalizeCodePart(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]/g, '')
    .toUpperCase()
    .slice(0, 3)
    .padEnd(3, 'X');
}

async function generateClassroomCode(name: string) {
  const prefix = normalizeCodePart(name);

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
    const code = `${prefix}-${suffix}`;
    const existing = await prisma.classroom.findUnique({ where: { code } });

    if (!existing) return code;
  }

  throw new AppError('Não foi possível gerar um código único para a sala', 500);
}

function ensureCanCreateClass(role: string) {
  const normalizedRole = role.toUpperCase();
  if (normalizedRole !== 'PROFESSOR' && normalizedRole !== 'ADMIN') {
    throw new AppError('Você não tem permissão para criar salas', 403);
  }
}

export const classroomService = {
  async listForUser(userId: string, role: string) {
    const normalizedRole = role.toUpperCase();

    if (normalizedRole === 'PROFESSOR' || normalizedRole === 'ADMIN') {
      return prisma.classroom.findMany({
        where: normalizedRole === 'ADMIN' ? undefined : { teacherId: userId },
        include: {
          members: true,
          lessons: true,
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    return prisma.classroom.findMany({
      where: {
        members: {
          some: { userId },
        },
      },
      include: {
        members: true,
        lessons: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  async create(userId: string, role: string, data: CreateClassroomInput) {
    ensureCanCreateClass(role);

    const code = await generateClassroomCode(data.name);

    return prisma.classroom.create({
      data: {
        name: data.name,
        code,
        teacherId: userId,
      },
      include: {
        members: true,
        lessons: true,
      },
    });
  },
};
