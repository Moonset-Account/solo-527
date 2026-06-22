import { Router } from 'express';
import * as pluginController from '../controllers/plugin.controller.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.get('/', authMiddleware, pluginController.getPluginList);
router.get('/:id', authMiddleware, pluginController.getPluginDetail);

export default router;
