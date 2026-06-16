const express = require('express');
const router = express.Router();
const trainingController = require('../controllers/trainingController');
const { auth } = require('../middleware/auth');

router.use(auth);

router.get('/', trainingController.getTrainingRecords);
router.get('/:id', trainingController.getTrainingRecord);
router.post('/', trainingController.createTrainingRecord);
router.put('/:id', trainingController.updateTrainingRecord);
router.delete('/:id', trainingController.deleteTrainingRecord);

module.exports = router;
