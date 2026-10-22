import { Router } from 'express';
import { register, login, getMe } from '../controllers/authController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = Router();

// Publicly reachable endpoints (Registration requires x-admin-key secret header)
router.post('/register', register);
router.post('/login', login);

// Authenticated user profile check
router.get('/me', authMiddleware, getMe);

export default router;
