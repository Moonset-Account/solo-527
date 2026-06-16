const express = require('express');
const router = express.Router();
const exportController = require('../controllers/exportController');
const { auth } = require('../middleware/auth');

router.use(auth);

router.get('/applications', exportController.exportApplications);
router.get('/pets', exportController.exportPets);

module.exports = router;
