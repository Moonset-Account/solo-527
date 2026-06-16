const express = require('express');
const router = express.Router();
const flowRecordController = require('../controllers/flowRecordController');
const { auth } = require('../middleware/auth');

router.use(auth);

router.get('/', flowRecordController.getRecords);

module.exports = router;
