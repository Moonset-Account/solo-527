import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

import router from './routes/index.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

const uploadDir = process.env.UPLOAD_DIR || './uploads';
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  maxAge: 86400,
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

app.use('/uploads', express.static(path.join(process.cwd(), uploadDir)));

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: '生鲜仓供应商协作站 - 后端API',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0',
  });
});

app.use('/api', router);

app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`\n🚀 生鲜仓供应商协作站 API Server 启动成功！`);
  console.log(`📍 服务地址: http://localhost:${PORT}`);
  console.log(`🔍 健康检查: http://localhost:${PORT}/health`);
  console.log(`📚 API 前缀:  http://localhost:${PORT}/api\n`);
});

process.on('uncaughtException', (err) => {
  console.error('❌ 未捕获异常:', err);
});
process.on('unhandledRejection', (reason) => {
  console.error('❌ 未处理Promise拒绝:', reason);
});
