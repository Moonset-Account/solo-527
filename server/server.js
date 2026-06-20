require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');

const config = require('./src/config');
const { redisClient, connectRedis } = require('./src/config/redis');

const serviceRoutes = require('./src/routes/serviceRoutes');
const pricingRuleRoutes = require('./src/routes/pricingRuleRoutes');
const technicianRoutes = require('./src/routes/technicianRoutes');
const partRoutes = require('./src/routes/partRoutes');
const orderRoutes = require('./src/routes/orderRoutes');
const satisfactionRoutes = require('./src/routes/satisfactionRoutes');
const auditLogRoutes = require('./src/routes/auditLogRoutes');
const reportRoutes = require('./src/routes/reportRoutes');
const authRoutes = require('./src/routes/authRoutes');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use((req, res, next) => {
  req.redis = redisClient;
  next();
});

app.use('/api/auth', authRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/pricing-rules', pricingRuleRoutes);
app.use('/api/technicians', technicianRoutes);
app.use('/api/parts', partRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/satisfaction', satisfactionRoutes);
app.use('/api/audit-logs', auditLogRoutes);
app.use('/api/reports', reportRoutes);

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    redis: redisClient.isReady ? 'connected' : 'disconnected'
  });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || '服务器内部错误',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

async function startServer() {
  let mongodbConnected = false;
  let redisConnected = false;
  
  try {
    console.log('正在连接 MongoDB...');
    await Promise.race([
      mongoose.connect(config.mongodbUri, {
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 5000
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('MongoDB 连接超时')), 6000)
      )
    ]);
    mongodbConnected = true;
    console.log('MongoDB 连接成功');
  } catch (error) {
    console.warn('MongoDB 连接失败:', error.message);
    console.warn('服务器将继续运行，但部分功能可能不可用');
  }
  
  try {
    console.log('正在连接 Redis...');
    await Promise.race([
      connectRedis(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Redis 连接超时')), 3000)
      )
    ]);
    redisConnected = true;
    console.log('Redis 连接成功');
  } catch (error) {
    console.warn('Redis 连接失败:', error.message);
    console.warn('服务器将继续运行，但缓存功能将不可用');
  }
  
  app.listen(config.port, () => {
    console.log(`服务器运行在 http://localhost:${config.port}`);
    console.log(`MongoDB: ${mongodbConnected ? '已连接' : '未连接'}`);
    console.log(`Redis: ${redisConnected ? '已连接' : '未连接'}`);
  });
}

startServer();
