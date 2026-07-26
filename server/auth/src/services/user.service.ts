import { prisma } from "../config/prisma";

export const userService = {
    findByEmail(email: string) {
        return prisma.user.findUnique({ where: { email } });
    }
};
