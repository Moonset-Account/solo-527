const express = require('express');
const router = express.Router();
const memberTreatmentController = require('../controllers/memberTreatmentController');
const auth = require('../middleware/auth');

router.use(auth);

router.get('/', memberTreatmentController.getMemberTreatments);
router.get('/remaining', memberTreatmentController.getRemainingSessions);
router.get('/:id', memberTreatmentController.getMemberTreatmentById);
router.post('/', memberTreatmentController.purchaseTreatment);
router.post('/:id/deduct', memberTreatmentController.deductSessions);
router.put('/:id', memberTreatmentController.updateMemberTreatment);

module.exports = router;
