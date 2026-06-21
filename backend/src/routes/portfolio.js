const express = require('express');
const router = express.Router();
const portfolioController = require('../controllers/portfolioController');
const { auth } = require('../middleware/auth');

router.use(auth);

router.get('/', portfolioController.getPortfolio);
router.get('/:id', portfolioController.getPortfolioById);
router.post('/', portfolioController.createPortfolio);
router.put('/:id', portfolioController.updatePortfolio);
router.delete('/:id', portfolioController.deletePortfolio);
router.post('/upload-image', portfolioController.uploadImage);

module.exports = router;
