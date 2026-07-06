import { Router } from 'express';
import * as ctrl from '../controllers/requirement.controller';
import { validateBody } from '../middleware/validate';
import { asyncHandler } from '../utils/asyncHandler';

// mergeParams so :timelineId from the mount path is available here.
const router = Router({ mergeParams: true });

router.get('/', asyncHandler(ctrl.index));
router.post('/', validateBody(ctrl.requirementStoreSchema), asyncHandler(ctrl.store));
router.get('/:requirementId', asyncHandler(ctrl.show));
router.put('/:requirementId', validateBody(ctrl.requirementUpdateSchema), asyncHandler(ctrl.update));
router.patch('/:requirementId', validateBody(ctrl.requirementUpdateSchema), asyncHandler(ctrl.update));
router.delete('/:requirementId', asyncHandler(ctrl.destroy));

export default router;
