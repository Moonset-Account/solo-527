const express = require('express');
const router = express.Router();
const gridController = require('../controllers/gridController');
const { auth, requireRole } = require('../middleware/auth');

router.get('/', auth, gridController.getGrids);
router.get('/all', auth, gridController.getAllGrids);
router.get('/:id', auth, gridController.getGridById);
router.post('/', auth, requireRole('ADMIN'), gridController.createGrid);
router.put('/:id', auth, requireRole('ADMIN'), gridController.updateGrid);
router.delete('/:id', auth, requireRole('ADMIN'), gridController.deleteGrid);

module.exports = router;
