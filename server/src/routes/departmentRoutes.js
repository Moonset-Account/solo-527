const express = require('express');
const router = express.Router();
const departmentController = require('../controllers/departmentController');
const { auth, requireRole } = require('../middleware/auth');

router.get('/', auth, departmentController.getDepartments);
router.get('/all', auth, departmentController.getAllDepartments);
router.get('/:id', auth, departmentController.getDepartmentById);
router.post('/', auth, requireRole('ADMIN'), departmentController.createDepartment);
router.put('/:id', auth, requireRole('ADMIN'), departmentController.updateDepartment);
router.delete('/:id', auth, requireRole('ADMIN'), departmentController.deleteDepartment);

module.exports = router;
