import { Router } from 'express';
import * as ctrl from '../controllers/timeline.controller';
import { validateBody } from '../middleware/validate';
import { asyncHandler } from '../utils/asyncHandler';

// mergeParams so :projectId from the mount path is available here.
const router = Router({ mergeParams: true });

router.get('/', asyncHandler(ctrl.index));
router.post('/', validateBody(ctrl.timelineStoreSchema), asyncHandler(ctrl.store));
router.get('/:timelineId', asyncHandler(ctrl.show));
router.put('/:timelineId', validateBody(ctrl.timelineUpdateSchema), asyncHandler(ctrl.update));
router.patch('/:timelineId', validateBody(ctrl.timelineUpdateSchema), asyncHandler(ctrl.update));
router.delete('/:timelineId', asyncHandler(ctrl.destroy));

export default router;
