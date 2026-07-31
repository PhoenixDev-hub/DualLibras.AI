import { prisma } from '../config/prisma';
import type { RegisterInput } from '../schemas/auth.schema';

type CreateUserInput = Omit<RegisterInput, 'password'> & {
  passwordHash: string;
};

export const userService = {
  findByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } });
  },

  findById(id: string) {
    return prisma.user.findUnique({ where: { id } });
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
        societyProfile: data.role === 'SOCIEDADE'
          ? {
              create: {},
            }
          : undefined,
      },
    });
  },
};
