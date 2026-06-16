import { Router } from 'express';
import { success } from '../utils/response.js';
import authRouter from './auth.js';
import usersRouter from './users.js';
import suppliersRouter from './suppliers.js';
import categoriesRouter from './categories.js';
import productsRouter from './products.js';
import purchaseOrdersRouter from './purchase-orders.js';
import inboundOrdersRouter from './inbound-orders.js';
import outboundOrdersRouter from './outbound-orders.js';
import inventoryRouter from './inventory.js';
import batchesRouter from './batches.js';
import exceptionsRouter from './exceptions.js';
import repliesRouter from './replies.js';
import alertsRouter from './alerts.js';
import batchOpsRouter from './batch-ops.js';
import restockRouter from './restock.js';
import statisticsRouter from './statistics.js';
import exportRouter from './export.js';

const router = Router();

router.get('/', (_req, res) => {
  return success(res, {
    name: '生鲜仓供应商协作站 API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      suppliers: '/api/suppliers',
      categories: '/api/categories',
      products: '/api/products',
      purchaseOrders: '/api/purchase-orders',
      inboundOrders: '/api/inbound-orders',
      outboundOrders: '/api/outbound-orders',
      inventory: '/api/inventory',
      batches: '/api/batches',
      exceptions: '/api/exceptions',
      replies: '/api/replies',
      alerts: '/api/alerts',
      batchOps: '/api/batch-ops',
      restock: '/api/restock',
      statistics: '/api/statistics',
      export: '/api/export',
    },
  });
});

router.use('/auth', authRouter);
router.use('/users', usersRouter);
router.use('/suppliers', suppliersRouter);
router.use('/categories', categoriesRouter);
router.use('/products', productsRouter);
router.use('/purchase-orders', purchaseOrdersRouter);
router.use('/inbound-orders', inboundOrdersRouter);
router.use('/outbound-orders', outboundOrdersRouter);
router.use('/inventory', inventoryRouter);
router.use('/batches', batchesRouter);
router.use('/exceptions', exceptionsRouter);
router.use('/replies', repliesRouter);
router.use('/alerts', alertsRouter);
router.use('/batch-ops', batchOpsRouter);
router.use('/restock', restockRouter);
router.use('/statistics', statisticsRouter);
router.use('/export', exportRouter);

export default router;
