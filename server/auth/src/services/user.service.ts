import { RoleSchema } from '../schemas/Enums.schema';
import { prisma } from '../config/prisma';
import type { RegisterInput } from '../schemas/Auth.schema';

type CreateUserInput = Omit<RegisterInput, 'password'> & {
  passwordHash: string;
};

export const userService = {
  findByEmail(email: string, activeOnly = false) {
    return prisma.user.findFirst({
      where: { email: { equals: email, mode: 'insensitive' }, ...(activeOnly ? { role: { in: RoleSchema.options } } : {}) },
      include: {
        teacherProfile: true,
        studentProfile: true,
      },
    });
  },

  findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      include: {
        teacherProfile: true,
        studentProfile: true,
      },
    });
  },

  create(data: CreateUserInput) {
    return prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash: data.passwordHash,
        role: data.role,
        teacherProfile: data.role === 'PROFESSOR'
          ? {
              create: {
                discipline: data.discipline,
                institution: data.institution,
              },
            }
          : undefined,
        studentProfile: data.role === 'ALUNO'
          ? {
              create: {
                registrationNumber: data.registrationNumber,
                institution: data.institution,
              },
            }
          : undefined,
      },
    });
  },
};
