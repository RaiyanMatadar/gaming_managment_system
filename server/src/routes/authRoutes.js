import { Router } from 'express';
import { register, login, getMe, updateProfile } from '../controllers/authController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = Router();

// Publicly reachable endpoints (Registration requires x-admin-key secret header)
router.post('/register', register);
router.post('/login', login);

// Authenticated user profile check & settings
router.get('/me', authMiddleware, getMe);
router.patch('/profile', authMiddleware, updateProfile);
router.patch('/me', authMiddleware, updateProfile);

export default router;
