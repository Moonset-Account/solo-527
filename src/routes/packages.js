const express = require('express');
const router = express.Router();
const packageController = require('../controllers/packageController');
const { authenticateToken, checkPermission } = require('../middleware/auth');

router.get('/', authenticateToken, checkPermission('PACKAGE_VIEW'), packageController.getPackages);
router.get('/:id', authenticateToken, checkPermission('PACKAGE_VIEW'), packageController.getPackageById);
router.post('/', authenticateToken, checkPermission('PACKAGE_PREPARE'), packageController.createPackage);
router.post('/from-template', authenticateToken, checkPermission('PACKAGE_PREPARE'), packageController.createPackageFromTemplate);
router.put('/:packageId/items/:itemId', authenticateToken, checkPermission('PACKAGE_PREPARE'), packageController.updatePackageItem);
router.post('/:id/submit', authenticateToken, checkPermission('PACKAGE_PREPARE'), packageController.submitPackageForReview);
router.post('/:id/review', authenticateToken, checkPermission('PACKAGE_REVIEW'), packageController.reviewPackage);
router.post('/:id/approve', authenticateToken, checkPermission('PACKAGE_REVIEW'), packageController.approvePackage);
router.post('/:id/confirm', authenticateToken, checkPermission('PACKAGE_CONFIRM'), packageController.confirmPackage);
router.post('/:id/distribute', authenticateToken, checkPermission('PACKAGE_CONFIRM'), packageController.distributePackage);
router.post('/:id/deliver', authenticateToken, checkPermission('PACKAGE_CONFIRM'), packageController.deliverPackage);
router.post('/:id/use', authenticateToken, checkPermission('PACKAGE_CONFIRM'), packageController.markPackageUsed);
router.post('/:id/scan', authenticateToken, checkPermission('PACKAGE_CONFIRM'), packageController.scanPackageItem);

module.exports = router;
