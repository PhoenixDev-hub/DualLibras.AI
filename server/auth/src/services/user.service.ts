import { prisma } from "../config/prisma";

export const userService = {
    findByEmail(email: string) {
        return prisma.User.findUnique({ where: { email } });
    },
    
    findById(id: string) {
        return prisma.User.findUnique({ where: { id }})
    },

};
