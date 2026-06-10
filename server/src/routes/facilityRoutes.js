const express = require('express');
const router = express.Router();
const facilityController = require('../controllers/facilityController');
const { auth, requireRole } = require('../middleware/auth');

router.get('/', auth, facilityController.getFacilities);
router.get('/statistics', auth, facilityController.getFacilityStatistics);
router.get('/:id', auth, facilityController.getFacilityById);
router.post('/', auth, requireRole('ADMIN'), facilityController.createFacility);
router.put('/:id', auth, requireRole('ADMIN'), facilityController.updateFacility);
router.put('/:id/status', auth, facilityController.updateFacilityStatus);
router.delete('/:id', auth, requireRole('ADMIN'), facilityController.deleteFacility);

module.exports = router;
