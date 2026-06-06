const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const cron = require('node-cron');
require('dotenv').config();

const { errorHandler, notFoundHandler } = require('./middleware/error');
const { logger } = require('./utils/logger');
const { checkExpiringBatches, checkLowStock, checkPendingPackages } = require('./controllers/notificationController');

const authRoutes = require('./routes/auth');
const scheduleRoutes = require('./routes/schedules');
const packageRoutes = require('./routes/packages');
const returnRoutes = require('./routes/returns');
const inventoryRoutes = require('./routes/inventory');
const reconciliationRoutes = require('./routes/reconciliations');
const importExportRoutes = require('./routes/importExport');
const notificationRoutes = require('./routes/notifications');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet({
  contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false,
}));
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: { success: false, message: '请求过于频繁，请稍后再试' },
});
app.use(limiter);

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/exports', express.static(path.join(__dirname, '../exports')));
app.use(express.static(path.join(__dirname, '../public')));

app.get('/api/health', (req, res) => {
  res.json({ 
    success: true, 
    message: '手术室耗材备包系统运行正常',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/packages', packageRoutes);
app.use('/api/returns', returnRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/reconciliations', reconciliationRoutes);
app.use('/api/import-export', importExportRoutes);
app.use('/api/notifications', notificationRoutes);

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.use(notFoundHandler);
app.use(errorHandler);

cron.schedule('0 8 * * *', async () => {
  logger.info('Running daily scheduled tasks...');
  await checkExpiringBatches();
  await checkLowStock();
  await checkPendingPackages();
  logger.info('Daily scheduled tasks completed');
});

cron.schedule('0 */4 * * *', async () => {
  await checkPendingPackages();
});

const server = app.listen(PORT, () => {
  logger.info(`🚀 手术室耗材备包系统启动成功`);
  logger.info(`📍 服务地址: http://localhost:${PORT}`);
  logger.info(`📊 API 文档: http://localhost:${PORT}/api/health`);
  logger.info(`🕐 当前环境: ${process.env.NODE_ENV || 'development'}`);
});

process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Rejection:', err);
  server.close(() => process.exit(1));
});

process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => process.exit(0));
});

module.exports = app;
