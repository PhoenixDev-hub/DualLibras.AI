import { Router, type Request, type Response, type NextFunction } from 'express'
import { z } from 'zod'
import { prisma } from '../config/prisma'
import { authMiddleware } from '../middlewares/auth.middleware'
import { validate } from '../middlewares/validate.middleware'
import { AppError } from '../middlewares/error.middleware'
import { adminService } from '../services/admin.service'
import {
  adminQuerySchema,
  adminSchoolSchema,
  adminUserSchema,
  adminStatusSchema,
  adminPasswordSchema,
  adminClassroomSchema,
  adminLessonSchema,
  adminMemberSchema,
} from '../schemas/Admin.schema'

export const adminRoutes = Router()
const handle =
  (action: (req: Request, res: Response) => Promise<unknown>) =>
  (req: Request, res: Response, next: NextFunction) => {
    void action(req, res).catch(next)
  }
adminRoutes.use(authMiddleware)
adminRoutes.use(async (req, _res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.sub },
      select: { role: true, isActive: true },
    })
    if (!user?.isActive || user.role !== 'ADMIN')
      throw new AppError('Acesso restrito à administração', 403)
    next()
  } catch (error) {
    next(error)
  }
})
for (const name of ['id', 'userId'])
  adminRoutes.param(name, (_req, _res, next, value) => {
    if (!z.string().uuid().safeParse(value).success)
      return next(new AppError('Identificador inválido', 400))
    next()
  })
adminRoutes.get(
  '/overview',
  handle(async (_req, res) => res.json(await adminService.overview())),
)
adminRoutes.get(
  '/options',
  handle(async (_req, res) => res.json(await adminService.options())),
)
for (const resource of ['users', 'schools', 'classrooms', 'lessons', 'materials'] as const) {
  adminRoutes.get(
    `/${resource}`,
    handle(async (req, res) => {
      const query = adminQuerySchema.safeParse(req.query)
      if (!query.success) throw new AppError('Filtros inválidos', 400)
      res.json(await adminService[resource](query.data))
    }),
  )
}
adminRoutes.post(
  '/schools',
  validate(adminSchoolSchema),
  handle(async (req, res) =>
    res.status(201).json(await adminService.saveSchool(req.user!.sub, undefined, req.body)),
  ),
)
adminRoutes.patch(
  '/schools/:id',
  validate(adminSchoolSchema),
  handle(async (req, res) =>
    res.json(await adminService.saveSchool(req.user!.sub, String(req.params.id), req.body)),
  ),
)
adminRoutes.delete(
  '/schools/:id',
  handle(async (req, res) => {
    await adminService.deleteSchool(req.user!.sub, String(req.params.id))
    res.sendStatus(204)
  }),
)
adminRoutes.post(
  '/users',
  validate(adminUserSchema),
  handle(async (req, res) =>
    res.status(201).json(await adminService.saveUser(req.user!.sub, undefined, req.body)),
  ),
)
adminRoutes.patch(
  '/users/:id',
  validate(adminUserSchema),
  handle(async (req, res) =>
    res.json(await adminService.saveUser(req.user!.sub, String(req.params.id), req.body)),
  ),
)
adminRoutes.patch(
  '/users/:id/status',
  validate(adminStatusSchema),
  handle(async (req, res) =>
    res.json(
      await adminService.setUserActive(req.user!.sub, String(req.params.id), req.body.isActive),
    ),
  ),
)
adminRoutes.patch(
  '/users/:id/password',
  validate(adminPasswordSchema),
  handle(async (req, res) => {
    await adminService.resetPassword(req.user!.sub, String(req.params.id), req.body.password)
    res.sendStatus(204)
  }),
)
adminRoutes.delete(
  '/users/:id',
  handle(async (req, res) => {
    await adminService.deleteUser(req.user!.sub, String(req.params.id))
    res.sendStatus(204)
  }),
)
adminRoutes.post(
  '/classrooms',
  validate(adminClassroomSchema),
  handle(async (req, res) =>
    res.status(201).json(await adminService.saveClassroom(req.user!.sub, undefined, req.body)),
  ),
)
adminRoutes.patch(
  '/classrooms/:id',
  validate(adminClassroomSchema),
  handle(async (req, res) =>
    res.json(await adminService.saveClassroom(req.user!.sub, String(req.params.id), req.body)),
  ),
)
adminRoutes.delete(
  '/classrooms/:id',
  handle(async (req, res) => {
    await adminService.deleteClassroom(req.user!.sub, String(req.params.id))
    res.sendStatus(204)
  }),
)
adminRoutes.get(
  '/classrooms/:id/members',
  handle(async (req, res) => res.json(await adminService.members(String(req.params.id)))),
)
adminRoutes.post(
  '/classrooms/:id/members',
  validate(adminMemberSchema),
  handle(async (req, res) =>
    res
      .status(201)
      .json(await adminService.addMember(req.user!.sub, String(req.params.id), req.body.userId)),
  ),
)
adminRoutes.delete(
  '/classrooms/:id/members/:userId',
  handle(async (req, res) => {
    await adminService.removeMember(req.user!.sub, String(req.params.id), String(req.params.userId))
    res.sendStatus(204)
  }),
)
adminRoutes.get(
  '/lessons/:id',
  handle(async (req, res) => res.json(await adminService.lessonDetail(String(req.params.id)))),
)
adminRoutes.post(
  '/lessons',
  validate(adminLessonSchema),
  handle(async (req, res) =>
    res.status(201).json(await adminService.saveLesson(req.user!.sub, undefined, req.body)),
  ),
)
adminRoutes.patch(
  '/lessons/:id',
  validate(adminLessonSchema),
  handle(async (req, res) =>
    res.json(await adminService.saveLesson(req.user!.sub, String(req.params.id), req.body)),
  ),
)
adminRoutes.delete(
  '/lessons/:id',
  handle(async (req, res) => {
    await adminService.deleteLesson(req.user!.sub, String(req.params.id))
    res.sendStatus(204)
  }),
)
adminRoutes.delete(
  '/materials/:id',
  handle(async (req, res) => {
    await adminService.deleteMaterial(req.user!.sub, String(req.params.id))
    res.sendStatus(204)
  }),
)
