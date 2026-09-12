import { prisma } from '../config/prisma';
import { hashPassword } from '../utils/hash';

const password = 'Teste@123';

const users = [
  {
    name: 'Professor Teste',
    email: 'professor.teste@duallibras.local',
    role: 'PROFESSOR' as const,
    profile: {
      discipline: 'Matemática',
      institution: 'Escola Festival 2026',
    },
  },
  {
    name: 'Aluno Teste',
    email: 'aluno.teste@duallibras.local',
    role: 'ALUNO' as const,
    profile: {
      registrationNumber: 'ALU-2026-001',
      institution: 'Escola Festival 2026',
    },
  },
  {
    name: 'Visitante Sociedade',
    email: 'sociedade.teste@duallibras.local',
    role: 'SOCIEDADE' as const,
  },
  {
    name: 'Administrador Teste',
    email: 'admin.teste@duallibras.local',
    role: 'ADMIN' as const,
  },
];

async function seed() {
  const passwordHash = await hashPassword(password);

  for (const user of users) {
    const created = await prisma.user.upsert({
      where: { email: user.email },
      update: {
        name: user.name,
        passwordHash,
        role: user.role,
      },
      create: {
        name: user.name,
        email: user.email,
        passwordHash,
        role: user.role,
      },
    });

    if (user.role === 'PROFESSOR') {
      await prisma.teacherProfile.upsert({
        where: { userId: created.id },
        update: user.profile,
        create: {
          userId: created.id,
          ...user.profile,
        },
      });
    }

    if (user.role === 'ALUNO') {
      await prisma.studentProfile.upsert({
        where: { userId: created.id },
        update: user.profile,
        create: {
          userId: created.id,
          ...user.profile,
        },
      });
    }

    if (user.role === 'SOCIEDADE') {
      await prisma.societyProfile.upsert({
        where: { userId: created.id },
        update: {},
        create: {
          userId: created.id,
        },
      });
    }
  }

  console.table(users.map((user) => ({
    nome: user.name,
    email: user.email,
    perfil: user.role,
    senha: password,
  })));
}

seed()
  .catch((error) => {
    console.error('Falha ao criar usuários de teste:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
