const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');
const auth = require('../middleware/auth');

router.use(auth);

router.get('/', appointmentController.getAppointments);
router.get('/:id', appointmentController.getAppointmentById);
router.post('/', appointmentController.createAppointment);
router.put('/:id', appointmentController.updateAppointment);
router.post('/:id/confirm', appointmentController.confirmAppointment);
router.post('/:id/complete', appointmentController.completeAppointment);
router.post('/:id/cancel', appointmentController.cancelAppointment);
router.delete('/:id', appointmentController.deleteAppointment);

module.exports = router;
