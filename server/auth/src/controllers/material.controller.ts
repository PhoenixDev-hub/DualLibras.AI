import type { NextFunction, Request, Response } from 'express'
import { AppError } from '../middlewares/error.middleware'
import { uploadMaterialSchema } from '../schemas/Material.schema'
import { formatMaterial, materialService } from '../services/material.service'
import { userService } from '../services/user.service'

export const materialController = {
  options(_req: Request, res: Response) {
    res.json(materialService.getUploadOptions())
  },
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.sub
      if (!userId) throw new AppError('Não autenticado', 401)

      const user = await userService.findById(userId)
      if (!user) throw new AppError('Usuário não encontrado', 404)

      const materials = await materialService.listForUser(user.id, user.role)
      res.json({ materials: materials.map(formatMaterial) })
    } catch (err) {
      next(err)
    }
  },

  async upload(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.sub
      if (!userId) throw new AppError('Não autenticado', 401)

      const user = await userService.findById(userId)
      if (!user) throw new AppError('Usuário não encontrado', 404)

      const parsed = uploadMaterialSchema.safeParse(req.body)
      if (!parsed.success) {
        throw new AppError(parsed.error.issues[0]?.message ?? 'Dados inválidos', 400)
      }

      const credentials: Record<string, string> = {}
      if (req.headers.cookie) credentials.Cookie = req.headers.cookie
      if (req.headers.authorization) credentials.Authorization = req.headers.authorization
      const result = await materialService.upload(user.id, user.role, parsed.data, credentials)

      res.status(201).json({
        material: formatMaterial(result.material),
        ai: {
          sent: result.sentToAi,
          status: result.sentToAi ? 'enviado' : 'pendente',
        },
      })
    } catch (err) {
      next(err)
    }
  },
}
