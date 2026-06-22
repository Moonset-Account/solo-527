import { Router } from 'express';
import * as licenseController from '../controllers/license.controller.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.get('/', authMiddleware, licenseController.getLicenseList);
router.get('/:id', authMiddleware, licenseController.getLicenseDetail);

export default router;
