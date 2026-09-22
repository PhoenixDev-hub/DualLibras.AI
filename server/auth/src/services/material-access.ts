import type { Prisma } from '../generated/prisma/client';

// A room attachment and a lesson attachment share the room's current audience.
// Old lesson attachments may not have classroomId populated yet.
export function materialAccessWhere(userId: string, role?: string): Prisma.MaterialWhereInput {
  if (role === 'ADMIN') return {};
  const classroom = { OR: [{ teacherId: userId }, { members: { some: { userId } } }] };
  return { OR: [
    { classroom },
    { classroomId: null, lesson: { classroom } },
  ] };
}
