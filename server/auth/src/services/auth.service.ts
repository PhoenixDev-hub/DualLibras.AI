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
    });

    const token = signToken({ sub: user.id, email: user.email });
    return {
      token,
      user: { id: user.id, name: user.name, email: user.email },
    };
  },

  async login(data: LoginInput) {
    const user = await userService.findByEmail(data.email);
    if (!user || !user.password) {
      throw new AppError('E-mail ou senha inválidos', 401);
    }

    const passwordMatches = await comparePassword(data.password, user.password);
    if (!passwordMatches) {
      throw new AppError('E-mail ou senha inválidos', 401);
    }

    const token = signToken({ sub: user.id, email: user.email });
    return {
      token,
      user: { id: user.id, name: user.name, email: user.email },
    };
  },
};
