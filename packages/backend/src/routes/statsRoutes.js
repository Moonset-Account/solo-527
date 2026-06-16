const express = require('express');
const router = express.Router();
const statsController = require('../controllers/statsController');
const { auth } = require('../middleware/auth');

router.use(auth);

router.get('/overview', statsController.getOverviewStats);
router.get('/adoption/trainer', statsController.getAdoptionStatsByTrainer);
router.get('/adoption/date', statsController.getAdoptionStatsByDate);
router.get('/adoption/missing-fields', statsController.getMissingFieldStats);
router.get('/training', statsController.getTrainingStats);
router.get('/visit', statsController.getVisitStats);

module.exports = router;
