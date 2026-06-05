const express = require('express');
const router = express.Router();
const maintenanceController = require('../controllers/maintenanceController');
const authMiddleware = require('../middleware/auth');
const { roleMiddleware } = require('../middleware/permissions');
const upload = require('../middleware/upload');

router.get('/my', authMiddleware, maintenanceController.getMyMaintenances);
router.get('/', authMiddleware, roleMiddleware(['admin', 'volunteer']), maintenanceController.getAllMaintenances);
router.post('/', authMiddleware, upload.array('photos', 5), maintenanceController.createMaintenance);
router.put('/:id/status', authMiddleware, roleMiddleware(['admin', 'volunteer']), maintenanceController.updateMaintenanceStatus);

module.exports = router;
