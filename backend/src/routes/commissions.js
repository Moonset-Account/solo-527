const express = require('express');
const router = express.Router();
const commissionController = require('../controllers/commissionController');
const auth = require('../middleware/auth');

router.use(auth);

router.get('/', commissionController.getCommissions);
router.get('/:id', commissionController.getCommissionById);
router.post('/', commissionController.createCommission);
router.put('/:id', commissionController.updateCommission);
router.post('/:id/settle', commissionController.settleCommission);
router.delete('/:id', commissionController.deleteCommission);

module.exports = router;
