import { Router } from 'express';
import { classroomController } from '../controllers/classroom.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

export const classroomRoutes = Router();

classroomRoutes.get('/', authMiddleware, classroomController.list);
classroomRoutes.post('/', authMiddleware, classroomController.create);
