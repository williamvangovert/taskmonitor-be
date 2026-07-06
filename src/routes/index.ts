import { Router } from 'express';
import authRoutes from './auth.routes';

const router = Router();

// Health check — confirms the API is up.
router.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'taskmonitor-be', runtime: 'express' });
});

// Auth: /register, /login, /logout, /me, /users
router.use(authRoutes);

// Domain routes (projects, enhancements, timelines, requirements, dashboard,
// notifications) are added in the later migration stages.

export default router;
