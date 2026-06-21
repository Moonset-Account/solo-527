const express = require('express');
const router = express.Router();
const consultantController = require('../controllers/consultantController');
const auth = require('../middleware/auth');

router.use(auth);

router.get('/', consultantController.getConsultants);
router.get('/:id', consultantController.getConsultantById);
router.post('/', consultantController.createConsultant);
router.put('/:id', consultantController.updateConsultant);
router.delete('/:id', consultantController.deleteConsultant);
router.get('/:id/commissions', consultantController.getConsultantCommissions);

module.exports = router;
