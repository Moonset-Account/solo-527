const express = require('express');
const router = express.Router();
const volunteerController = require('../controllers/volunteerController');
const { auth } = require('../middleware/auth');

router.get('/', auth, volunteerController.getVolunteerServices);
router.get('/statistics', auth, volunteerController.getVolunteerStatistics);
router.get('/:id', auth, volunteerController.getVolunteerServiceById);
router.post('/', auth, volunteerController.createVolunteerService);
router.put('/:id', auth, volunteerController.updateVolunteerService);
router.delete('/:id', auth, volunteerController.deleteVolunteerService);

module.exports = router;
