const express = require('express');
const router = express.Router();
const borrowController = require('../controllers/borrowController');
const authMiddleware = require('../middleware/auth');
const { roleMiddleware } = require('../middleware/permissions');
const upload = require('../middleware/upload');

router.get('/my', authMiddleware, borrowController.getMyBorrows);
router.get('/', authMiddleware, roleMiddleware(['admin', 'volunteer']), borrowController.getAllBorrows);
router.post('/', authMiddleware, borrowController.createBorrow);
router.put('/:id/approve', authMiddleware, roleMiddleware(['admin', 'volunteer']), borrowController.approveBorrow);
router.put('/:id/reject', authMiddleware, roleMiddleware(['admin', 'volunteer']), borrowController.rejectBorrow);
router.put('/:id/pickup', authMiddleware, roleMiddleware(['admin', 'volunteer']), borrowController.confirmPickup);
router.put('/:id/return', authMiddleware, roleMiddleware(['admin', 'volunteer']), upload.single('returnPhoto'), borrowController.returnTool);
router.put('/:id/pay-deposit', authMiddleware, borrowController.payDeposit);
router.put('/:id/report-damage', authMiddleware, borrowController.reportDamage);

module.exports = router;
