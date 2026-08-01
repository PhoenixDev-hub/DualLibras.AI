import { AppError } from '../middlewares/error.middleware';
import { userService } from './user.service';
import { hashPassword, comparePassword } from '../utils/hash';
import { signToken } from '../utils/jwt';
import type { RegisterInput, LoginInput } from '../schemas/auth.schema';

export const authService = {
  async register(data: RegisterInput) {
    const existing = await userService.findByEmail(data.email);
    if (existing) {
      throw new AppError('Este e-mail já está cadastrado', 409);
    }

    const passwordHash = await hashPassword(data.password);
    const user = await userService.create({
      name: data.name,
      email: data.email,
      passwordHash,
      role: data.role,
      institution: data.institution,
      discipline: data.discipline,
      registrationNumber: data.registrationNumber,
    });

    const token = signToken({ sub: user.id, email: user.email });
    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        discipline: data.discipline,
        institution: data.institution,
      },
    };
  },

  async login(data: LoginInput) {
    const user = await userService.findByEmail(data.email);
    if (!user || !user.passwordHash) {
      throw new AppError('E-mail ou senha inválidos', 401);
    }

    const passwordMatches = await comparePassword(data.password, user.passwordHash);
    if (!passwordMatches) {
      throw new AppError('E-mail ou senha inválidos', 401);
    }

    const token = signToken({ sub: user.id, email: user.email });
    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        discipline: user.teacherProfile?.discipline,
        institution: user.teacherProfile?.institution ?? user.studentProfile?.institution,
        registrationNumber: user.studentProfile?.registrationNumber,
      },
    };
  },
};
