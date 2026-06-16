const express = require('express');
const router = express.Router();
const adoptionController = require('../controllers/adoptionController');
const { auth } = require('../middleware/auth');

router.use(auth);

router.get('/', adoptionController.getApplications);
router.get('/:id', adoptionController.getApplication);
router.post('/', adoptionController.createApplication);
router.put('/:id', adoptionController.updateApplication);
router.post('/:id/submit', adoptionController.submitApplication);
router.post('/:id/review', adoptionController.reviewApplication);
router.post('/:id/complete', adoptionController.completeApplication);

module.exports = router;
