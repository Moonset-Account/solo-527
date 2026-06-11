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

async function startServer() {
  try {
    await initializeDatabase();
    await initializeRedis();
    
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`API base URL: http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export default app;
