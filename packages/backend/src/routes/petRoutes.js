const express = require('express');
const router = express.Router();
const petController = require('../controllers/petController');
const { auth, requireRole } = require('../middleware/auth');

router.use(auth);

router.get('/', petController.getPets);
router.get('/:id', petController.getPet);
router.post('/', petController.createPet);
router.put('/:id', petController.updatePet);
router.delete('/:id', requireRole('admin'), petController.deletePet);
router.patch('/:id/status', petController.updatePetStatus);

module.exports = router;
