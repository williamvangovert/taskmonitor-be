import { Router } from 'express';
import * as ctrl from '../controllers/project.controller';
import { validateBody } from '../middleware/validate';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.get('/', asyncHandler(ctrl.index));
router.post('/', validateBody(ctrl.projectStoreSchema), asyncHandler(ctrl.store));
router.get('/:id', asyncHandler(ctrl.show));
router.put('/:id', validateBody(ctrl.projectUpdateSchema), asyncHandler(ctrl.update));
router.patch('/:id', validateBody(ctrl.projectUpdateSchema), asyncHandler(ctrl.update));
router.delete('/:id', asyncHandler(ctrl.destroy));

export default router;
