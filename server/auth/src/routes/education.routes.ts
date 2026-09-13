import { Router } from "express";
import { z } from "zod";
import { prisma } from "../config/prisma";
import { authMiddleware } from "../middlewares/auth.middleware";
import { AppError } from "../middlewares/error.middleware";
import { createClassroomSchema } from "../schemas/classroom.schema";

export const educationRoutes = Router();
educationRoutes.use(authMiddleware);
educationRoutes.use(async (req, _res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user!.sub } });
    if (!user) throw new AppError("Usuário não encontrado", 401);
    next();
  } catch (error) {
    next(error);
  }
});
async function owned(userId: string, id: string) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const room = await prisma.classroom.findUnique({ where: { id } });
  if (!room) throw new AppError("Sala não encontrada", 404);
  if (user.role !== "ADMIN" && room.teacherId !== userId)
    throw new AppError("Sem permissão para alterar esta sala", 403);
  return room;
}
educationRoutes.get("/", async (req, res, next) => {
  try {
    const userId = req.user!.sub;
    const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
    const rooms = await prisma.classroom.findMany({
      where:
        user.role === "ADMIN"
          ? {}
          : { OR: [{ teacherId: userId }, { members: { some: { userId } } }] },
      include: {
        teacher: {
          select: {
            name: true,
            teacherProfile: { select: { discipline: true } },
          },
        },
        members: {
          include: { user: { select: { id: true, name: true, role: true } } },
        },
        lessons: {
          include: {
            summary: true,
            transcriptionSessions: {
              select: { transcript: true },
              orderBy: { startedAt: "asc" },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    const materials = await prisma.material.findMany({
      where:
        user.role === "ADMIN"
          ? {}
          : {
              OR: [
                { uploadedById: userId },
                { lesson: { classroomId: { in: rooms.map((r) => r.id) } } },
              ],
            },
      include: { lesson: { select: { classroomId: true } } },
    });
    const glossaries = await prisma.glossary.findMany({
      where:
        user.role === "ADMIN"
          ? {}
          : {
              OR: [
                { ownerId: userId },
                { classroomId: { in: rooms.map((r) => r.id) } },
              ],
            },
      include: { terms: true },
    });
    const students = new Map<
      string,
      { id: string; name: string; classroomIds: string[]; joined: string }
    >();
    for (const room of rooms)
      for (const member of room.members) {
        if (member.user.role !== "ALUNO") continue;
        const student = students.get(member.userId) ?? {
          id: member.userId,
          name: member.user.name,
          classroomIds: [],
          joined: member.joinedAt.toISOString(),
        };
        student.classroomIds.push(room.id);
        students.set(member.userId, student);
      }
    res.json({
      classrooms: rooms.map((r) => ({
        id: r.id,
        name: r.name,
        description: r.description ?? "",
        subject: r.teacher.teacherProfile?.discipline ?? "",
        teacherName: r.teacher.name,
        code: r.code,
        color: "blue",
        archived: false,
      })),
      students: [...students.values()],
      lessons: rooms.flatMap((r) =>
        r.lessons.map((l) => ({
          id: l.id,
          title: l.title,
          transcript: l.transcriptionSessions
            .map((s) => s.transcript)
            .filter(Boolean)
            .join("\n\n"),
          summary: l.summary?.content ?? "",
          classroomId: r.id,
          date: l.createdAt.toISOString(),
          duration:
            l.startedAt && l.finishedAt
              ? `${Math.round((+l.finishedAt - +l.startedAt) / 60000)} min`
              : "—",
          status: (
            {
              EM_ANDAMENTO: "live",
              FINALIZADA: "finished",
              AGENDADA: "scheduled",
              CANCELADA: "cancelled",
            } as const
          )[l.status],
        })),
      ),
      materials: materials.map((m) => ({
        id: m.id,
        name: m.name,
        type: m.type,
        subject: "Materiais",
        classroomId: m.lesson?.classroomId ?? "",
      })),
      terms: glossaries.flatMap((g) =>
        g.terms.map((t) => ({
          id: t.id,
          term: t.term,
          definition: t.definition ?? "",
          subject: g.subject,
          example: t.librasValue ?? "",
        })),
      ),
    });
  } catch (error) {
    next(error);
  }
});
educationRoutes.patch("/classrooms/:id", async (req, res, next) => {
  try {
    const id = String(req.params.id);
    await owned(req.user!.sub, id);
    const parsed = createClassroomSchema.safeParse(req.body);
    if (!parsed.success) throw new AppError("Nome ou descrição inválidos", 400);
    await prisma.classroom.update({ where: { id }, data: parsed.data });
    res.sendStatus(204);
  } catch (error) {
    next(error);
  }
});
educationRoutes.post("/join", async (req, res, next) => {
  try {
    const parsed = z
      .object({
        code: z
          .string()
          .trim()
          .min(1)
          .max(30)
          .transform((v) => v.toUpperCase()),
      })
      .safeParse(req.body);
    if (!parsed.success) throw new AppError("Informe um código válido", 400);
    const room = await prisma.classroom.findUnique({
      where: { code: parsed.data.code },
    });
    if (!room)
      throw new AppError("Sala não encontrada. Confira o código.", 404);
    const userId = req.user!.sub;
    await prisma.classroomMember.upsert({
      where: { classroomId_userId: { classroomId: room.id, userId } },
      create: { classroomId: room.id, userId },
      update: {},
    });
    res.json({ classroomId: room.id });
  } catch (error) {
    next(error);
  }
});
educationRoutes.delete(
  "/classrooms/:id/members/:userId",
  async (req, res, next) => {
    try {
      const classroomId = String(req.params.id);
      await owned(req.user!.sub, classroomId);
      await prisma.classroomMember.deleteMany({
        where: { classroomId, userId: String(req.params.userId) },
      });
      res.sendStatus(204);
    } catch (error) {
      next(error);
    }
  },
);
