require('dotenv').config();
const express = require('express');
const cors = require('cors');
const errorHandler = require('./middleware/errorHandler');

const authRoutes = require('./routes/auth');
const equipmentRoutes = require('./routes/equipment');
const processRoutes = require('./routes/process');
const workOrderRoutes = require('./routes/workOrder');
const productionPlanRoutes = require('./routes/productionPlan');
const processFlowRoutes = require('./routes/processFlow');
const utilizationRoutes = require('./routes/utilization');
const reworkRoutes = require('./routes/rework');
const materialRoutes = require('./routes/material');
const notificationRoutes = require('./routes/notification');
const logRoutes = require('./routes/logs');
const importRoutes = require('./routes/import');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (req, res) => {
  res.json({ code: 200, message: '注塑设备排产计划系统 API 运行正常', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/equipments', equipmentRoutes);
app.use('/api/processes', processRoutes);
app.use('/api/workorders', workOrderRoutes);
app.use('/api/plans', productionPlanRoutes);
app.use('/api/processflows', processFlowRoutes);
app.use('/api/utilizations', utilizationRoutes);
app.use('/api/reworks', reworkRoutes);
app.use('/api/materials', materialRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/import', importRoutes);

app.use(errorHandler);

app.use((req, res) => {
  res.status(404).json({ code: 404, message: '接口不存在' });
});

app.listen(PORT, () => {
  console.log(`🚀 服务器运行在 http://localhost:${PORT}`);
  console.log(`📊 API 文档: http://localhost:${PORT}/api/health`);
});

module.exports = app;
