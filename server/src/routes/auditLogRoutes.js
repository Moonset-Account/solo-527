const express = require('express');
const router = express.Router();
const auditLogController = require('../controllers/auditLogController');
const { authMiddleware, requireRole } = require('../middleware/auth');

router.get('/', authMiddleware, requireRole('super_admin', 'store_manager'), auditLogController.getAuditLogs);

router.get('/:id', authMiddleware, requireRole('super_admin', 'store_manager'), auditLogController.getAuditLogById);

router.get('/entity/:entityType/:entityId', authMiddleware, auditLogController.getEntityAuditLogs);

router.get('/compare/:logId', authMiddleware, requireRole('super_admin', 'store_manager'), auditLogController.compareVersions);

router.post('/restore/:logId', authMiddleware, requireRole('super_admin', 'store_manager'), auditLogController.restoreEntity);

router.get('/timeline/:entityType/:entityId', authMiddleware, requireRole('super_admin', 'store_manager'), auditLogController.getEntityVersionTimeline);

module.exports = router;
