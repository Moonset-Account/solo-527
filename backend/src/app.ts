import express from 'express';
import cors from 'cors';
import { initializeDatabase } from './database/data-source';
import { initializeRedis } from './cache/redis';
import authRoutes from './controllers/auth.controller';
import resumeRoutes from './controllers/resume.controller';
import questionRoutes from './controllers/question.controller';
import assessmentRoutes from './controllers/assessment.controller';
import interviewRoutes from './controllers/interview.controller';
import notificationRoutes from './controllers/notification.controller';
import recruitmentRoutes from './controllers/recruitment.controller';
import { NotificationService } from './services/NotificationService';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/resumes', resumeRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/assessments', assessmentRoutes);
app.use('/api/interviews', interviewRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/recruitment', recruitmentRoutes);

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    message: '服务器内部错误',
    data: null,
  });
});

let escalationCheckInterval: NodeJS.Timeout | null = null;

async function startServer() {
  try {
    await initializeDatabase();
    await initializeRedis();
    
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`API base URL: http://localhost:${PORT}/api`);
    });

    const notificationService = new NotificationService();
    setTimeout(async () => {
      try {
        console.log('[Scheduled Task] Running initial escalation check...');
        await notificationService.checkAndEscalateTasks();
        console.log('[Scheduled Task] Initial escalation check completed');
      } catch (error) {
        console.error('[Scheduled Task] Initial escalation check failed:', error);
      }
    }, 5000);

    escalationCheckInterval = setInterval(async () => {
      try {
        console.log(`[Scheduled Task] Running periodic escalation check at ${new Date().toISOString()}...`);
        await notificationService.checkAndEscalateTasks();
        console.log('[Scheduled Task] Periodic escalation check completed');
      } catch (error) {
        console.error('[Scheduled Task] Periodic escalation check failed:', error);
      }
    }, 5 * 60 * 1000);

    escalationCheckInterval.unref();

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

process.on('SIGTERM', () => {
  if (escalationCheckInterval) {
    clearInterval(escalationCheckInterval);
    console.log('Escalation check interval stopped');
  }
  process.exit(0);
});

process.on('SIGINT', () => {
  if (escalationCheckInterval) {
    clearInterval(escalationCheckInterval);
    console.log('Escalation check interval stopped');
  }
  process.exit(0);
});

startServer();

export default app;
