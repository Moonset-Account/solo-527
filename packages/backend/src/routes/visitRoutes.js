const express = require('express');
const router = express.Router();
const visitController = require('../controllers/visitController');
const { auth } = require('../middleware/auth');

router.use(auth);

router.get('/', visitController.getVisitRecords);
router.get('/:id', visitController.getVisitRecord);
router.post('/', visitController.createVisitRecord);
router.put('/:id', visitController.updateVisitRecord);
router.delete('/:id', visitController.deleteVisitRecord);

module.exports = router;
