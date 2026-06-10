const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const gridRoutes = require('./gridRoutes');
const departmentRoutes = require('./departmentRoutes');
const eventRoutes = require('./eventRoutes');
const volunteerRoutes = require('./volunteerRoutes');
const operationLogRoutes = require('./operationLogRoutes');
const notificationRoutes = require('./notificationRoutes');
const facilityRoutes = require('./facilityRoutes');
const statsRoutes = require('./statsRoutes');
const uploadRoutes = require('./uploadRoutes');

router.get('/health', (req, res) => {
  res.json({
    code: 200,
    message: '服务运行正常',
    data: {
      status: 'ok',
      timestamp: new Date().toISOString(),
    },
  });
});

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/grids', gridRoutes);
router.use('/departments', departmentRoutes);
router.use('/events', eventRoutes);
router.use('/volunteers', volunteerRoutes);
router.use('/operation-logs', operationLogRoutes);
router.use('/notifications', notificationRoutes);
router.use('/facilities', facilityRoutes);
router.use('/stats', statsRoutes);
router.use('/upload', uploadRoutes);

module.exports = router;
