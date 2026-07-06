import { Router } from 'express';
import * as auth from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

// Public
router.post('/register', validateBody(auth.registerSchema), asyncHandler(auth.register));
router.post('/login', validateBody(auth.loginSchema), asyncHandler(auth.login));

// Protected (require a valid Bearer JWT)
router.get('/me', authenticate, asyncHandler(auth.me));
router.get('/users', authenticate, asyncHandler(auth.users));
router.post('/logout', authenticate, asyncHandler(auth.logout));

export default router;
