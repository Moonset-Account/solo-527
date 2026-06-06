import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pool from './db';
import { connectRedis } from './redis';
import { startNotificationScheduler } from './services/notificationService';

import authRoutes from './routes/auth';
import materialRoutes from './routes/materials';
import activityRoutes from './routes/activities';
import borrowRoutes from './routes/borrows';
import compensationRoutes from './routes/compensations';
import auditRoutes from './routes/audit';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/materials', materialRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/borrows', borrowRoutes);
app.use('/api/compensations', compensationRoutes);
app.use('/api/audit', auditRoutes);

app.get('/api/health', async (req, res) => {
  try {
    const dbResult = await pool.query('SELECT 1 as health');
    res.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      database: dbResult.rows[0].health === 1 ? 'connected' : 'error'
    });
  } catch (error) {
    res.status(500).json({ status: 'error', error: 'Database connection failed' });
  }
});

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: '服务器内部错误' });
});

const startServer = async () => {
  try {
    await connectRedis();
    console.log('数据库连接池已初始化');
    
    startNotificationScheduler();
    
    app.listen(PORT, () => {
      console.log(`服务器运行在 http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('启动服务器失败:', error);
    process.exit(1);
  }
};

startServer();
