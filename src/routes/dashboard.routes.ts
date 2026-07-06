import { Router } from 'express';
import * as ctrl from '../controllers/dashboard.controller';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.get('/stats', asyncHandler(ctrl.stats));
router.get('/overdue', asyncHandler(ctrl.overdue));
router.get('/upcoming', asyncHandler(ctrl.upcoming));
router.get('/critical', asyncHandler(ctrl.critical));
router.get('/pic-performance', asyncHandler(ctrl.picPerformance));

export default router;
