import { prisma } from "../config/DB.js";

export const getUserById = async (id) => {
    return await prisma.user.findUnique({
        where: { id },
        select: {
            id: true,
            email: true,
            name: true,
            avatar: true,
            role: true,
            createdAt: true
        }
    })
}