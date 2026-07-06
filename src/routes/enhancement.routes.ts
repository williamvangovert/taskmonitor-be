import { Router } from 'express';
import * as ctrl from '../controllers/enhancement.controller';
import { validateBody } from '../middleware/validate';
import { asyncHandler } from '../utils/asyncHandler';

// mergeParams so :projectId from the mount path is available here.
const router = Router({ mergeParams: true });

router.get('/', asyncHandler(ctrl.index));
router.post('/', validateBody(ctrl.enhancementStoreSchema), asyncHandler(ctrl.store));
router.get('/:enhancementId', asyncHandler(ctrl.show));
router.put('/:enhancementId', validateBody(ctrl.enhancementUpdateSchema), asyncHandler(ctrl.update));
router.patch('/:enhancementId', validateBody(ctrl.enhancementUpdateSchema), asyncHandler(ctrl.update));
router.delete('/:enhancementId', asyncHandler(ctrl.destroy));

export default router;
