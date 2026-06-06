import { Router } from 'express';
import * as analyticsController from '../controllers/analyticsController';
import * as exportController from '../controllers/exportController';

const router = Router();

router.get('/overview', analyticsController.getOverview);
router.get('/funnel', analyticsController.getFunnel);
router.get('/pareto', analyticsController.getPareto);
router.get('/promotion', analyticsController.getPromotion);
router.get('/suppliers', analyticsController.getSuppliers);
router.get('/filters', analyticsController.getFilters);

router.post('/export', exportController.createExportTask);
router.get('/export/:id', exportController.getExportStatus);

export default router;
