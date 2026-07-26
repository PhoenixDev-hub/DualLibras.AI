import { Router } from 'express';

export const userRoutes = Router();

userRoutes.get('/me', (req, res) => {
    res.json({ message: 'User profile endpoint' });
});
