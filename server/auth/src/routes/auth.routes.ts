import { Router } from 'express';

export const authRoutes = Router();

authRoutes.post('/login', (req, res) => {
    res.json({ message: 'Login endpoint' });
});

authRoutes.post('/register', (req, res) => {
    res.json({ message: 'Register endpoint' });
});
