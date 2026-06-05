const express = require('express');
const router = express.Router();
const toolController = require('../controllers/toolController');
const authMiddleware = require('../middleware/auth');
const { roleMiddleware } = require('../middleware/permissions');
const upload = require('../middleware/upload');

router.get('/', authMiddleware, toolController.getAllTools);
router.get('/calendar', authMiddleware, toolController.getToolCalendar);
router.post('/check-availability', authMiddleware, toolController.checkAvailability);
router.get('/qr/:qrCode', authMiddleware, toolController.getToolByQrCode);
router.get('/:id', authMiddleware, toolController.getToolById);
router.post('/', authMiddleware, roleMiddleware(['admin', 'volunteer']), upload.single('image'), toolController.createTool);
router.put('/:id', authMiddleware, roleMiddleware(['admin', 'volunteer']), upload.single('image'), toolController.updateTool);
router.delete('/:id', authMiddleware, roleMiddleware(['admin']), toolController.deleteTool);

module.exports = router;
