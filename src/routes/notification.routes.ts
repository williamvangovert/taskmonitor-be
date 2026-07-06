import { Router } from 'express';
import * as ctrl from '../controllers/notification.controller';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.get('/', asyncHandler(ctrl.index));
router.post('/read-all', asyncHandler(ctrl.markAllRead));
router.post('/:id/read', asyncHandler(ctrl.markRead));

export default router;
