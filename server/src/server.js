const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const config = require('./config');
const connectDB = require('./db/mongoose');
const { connectRedis } = require('./db/redis');

const authRoutes = require('./routes/auth');
const storeRoutes = require('./routes/stores');
const userRoutes = require('./routes/users');
const businessRoutes = require('./routes/business');
const anomalyRoutes = require('./routes/anomalies');
const rectificationRoutes = require('./routes/rectifications');
const inventoryRoutes = require('./routes/inventory');
const couponRoutes = require('./routes/coupons');
const cashDifferenceRoutes = require('./routes/cashDifferences');
const logRoutes = require('./routes/logs');
const reminderRoutes = require('./routes/reminders');
const inspectionRoutes = require('./routes/inspections');
const dashboardRoutes = require('./routes/dashboard');

const app = express();

app.use(cors({
  origin: config.clientUrl,
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (config.nodeEnv === 'development') {
  app.use(morgan('dev'));
}

app.use('/api/auth', authRoutes);
app.use('/api/stores', storeRoutes);
app.use('/api/users', userRoutes);
app.use('/api/business', businessRoutes);
app.use('/api/anomalies', anomalyRoutes);
app.use('/api/rectifications', rectificationRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/cash-differences', cashDifferenceRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/reminders', reminderRoutes);
app.use('/api/inspections', inspectionRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: '茶飲門店巡店整改工具 API 服务正常' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: '服务器内部错误', error: err.message });
});

const startServer = async () => {
  try {
    await connectDB();
    await connectRedis();
    
    app.listen(config.port, () => {
      console.log(`Server is running on port ${config.port}`);
      console.log(`Environment: ${config.nodeEnv}`);
      console.log(`API Base: http://localhost:${config.port}/api`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;
