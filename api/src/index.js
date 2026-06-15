import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { createClient } from 'redis';

import authRoutes from './routes/auth.js';
import workOrderRoutes from './routes/workOrders.js';
import batchRoutes from './routes/batches.js';
import materialRoutes from './routes/materials.js';
import inspectionRoutes from './routes/inspections.js';
import scheduleRoutes from './routes/schedules.js';
import riskRoutes from './routes/risks.js';
import logRoutes from './routes/logs.js';
import { notFound, errorHandler } from './middleware/error.js';

const app = express();
const PORT = process.env.PORT || 4000;

export const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  socket: { reconnectStrategy: () => 5000 }
});

redisClient.on('error', (err) => console.warn('Redis 连接警告（本地未启动时可忽略）:', err.message));
redisClient.connect().catch(() => {});

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

app.get('/api/health', (req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/workorders', workOrderRoutes);
app.use('/api/batches', batchRoutes);
app.use('/api/materials', materialRoutes);
app.use('/api/inspections', inspectionRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/risks', riskRoutes);
app.use('/api/logs', logRoutes);

app.use(notFound);
app.use(errorHandler);

const boot = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/work_order_trace', {
      serverSelectionTimeoutMS: 5000
    });
    console.log('✅ MongoDB 已连接');
  } catch (err) {
    console.error('❌ MongoDB 连接失败:', err.message);
    console.error('💡 请启动本地 MongoDB (如 brew services start mongodb-community) 或配置正确的 MONGO_URI');
    console.error('💡 或使用 Docker: docker run -d -p 27017:27017 mongo:6');
    console.log('⚠️  API 仍会启动以方便调试前端，但所有数据接口将返回 500 错误');
  }
  app.listen(PORT, () => {
    console.log(`🚀 API 服务运行于 http://localhost:${PORT}`);
    console.log(`   健康检查: http://localhost:${PORT}/api/health`);
  });
};
boot();
