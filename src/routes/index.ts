import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import authRoutes from './auth.routes';
import enhancementRoutes from './enhancement.routes';
import projectRoutes from './project.routes';
import requirementRoutes from './requirement.routes';
import timelineRoutes from './timeline.routes';

const router = Router();

// Health check — confirms the API is up.
router.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'taskmonitor-be', runtime: 'express' });
});

// Auth (public: /register, /login; protected: /logout, /me, /users)
router.use(authRoutes);

// Everything below requires a valid Bearer JWT.
const protectedRouter = Router();
protectedRouter.use(authenticate);
protectedRouter.use('/projects', projectRoutes);
protectedRouter.use('/projects/:projectId/enhancements', enhancementRoutes);
protectedRouter.use('/projects/:projectId/timelines', timelineRoutes);
protectedRouter.use('/timelines/:timelineId/requirements', requirementRoutes);
router.use(protectedRouter);

// Still to come: dashboard (Stage 5), notifications (Stage 6).

export default router;
