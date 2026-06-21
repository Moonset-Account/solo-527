const express = require('express');
const router = express.Router();
const treatmentController = require('../controllers/treatmentController');
const auth = require('../middleware/auth');

router.use(auth);

router.get('/', treatmentController.getTreatments);
router.get('/:id', treatmentController.getTreatmentById);
router.post('/', treatmentController.createTreatment);
router.put('/:id', treatmentController.updateTreatment);
router.delete('/:id', treatmentController.deleteTreatment);

module.exports = router;
