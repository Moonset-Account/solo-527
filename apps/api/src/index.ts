import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { config } from './config';
import { connectMongoDB, disconnectMongoDB } from './db/mongodb';
import { connectRedis, disconnectRedis } from './db/redis';
import apiRouter from './routes';
import { errorHandler, notFoundHandler } from './middleware/error';

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined'));

app.use('/api', apiRouter);

app.get('/', (_req, res) => {
  res.json({
    name: '席位配置台 API',
    version: '1.0.0',
    status: 'running',
    docs: '/api/health',
  });
});

app.use(notFoundHandler);
app.use(errorHandler);

async function startServer() {
  try {
    await connectMongoDB();
    await connectRedis();

    app.listen(config.port, () => {
      console.log(`[Server] 席位配置台 API 运行在 http://localhost:${config.port}`);
      console.log(`[Server] 健康检查: http://localhost:${config.port}/api/health`);
    });
  } catch (err) {
    console.error('[Server] 启动失败:', err);
    process.exit(1);
  }
}

async function gracefulShutdown(signal: string) {
  console.log(`[Server] 收到 ${signal} 信号，正在优雅关闭...`);
  try {
    await disconnectMongoDB();
    await disconnectRedis();
    process.exit(0);
  } catch (err) {
    console.error('[Server] 关闭失败:', err);
    process.exit(1);
  }
}

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

startServer();

export default app;
