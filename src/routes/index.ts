import { Router } from 'express';

const router = Router();

// Health check — confirms the API is up. Domain routes (auth, projects,
// enhancements, timelines, requirements, dashboard, notifications) are added
// in the later migration stages.
router.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'taskmonitor-be', runtime: 'express' });
});

export default router;
