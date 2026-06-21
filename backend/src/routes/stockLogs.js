const express = require('express');
const router = express.Router();
const stockLogController = require('../controllers/stockLogController');
const auth = require('../middleware/auth');

router.use(auth);

router.get('/', stockLogController.getStockLogs);

module.exports = router;
