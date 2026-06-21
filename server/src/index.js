import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

import { connectDB } from './config/db.js';
import { connectRedis } from './config/redis.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';

import authRoutes from './routes/auth.js';
import activityRoutes from './routes/activities.js';
import scheduleRoutes from './routes/schedules.js';
import volunteerRoutes from './routes/volunteers.js';
import checkInRoutes from './routes/checkins.js';
import feedbackRoutes from './routes/feedbacks.js';
import donationRoutes from './routes/donations.js';
import absenceRoutes from './routes/absences.js';
import alertRoutes from './routes/alerts.js';
import statsRoutes from './routes/stats.js';
import uploadRoutes from './routes/uploads.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const uploadDir = path.resolve(__dirname, '../', process.env.UPLOAD_DIR || './uploads');
app.use('/uploads', express.static(uploadDir));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/volunteers', volunteerRoutes);
app.use('/api/checkins', checkInRoutes);
app.use('/api/feedbacks', feedbackRoutes);
app.use('/api/donations', donationRoutes);
app.use('/api/absences', absenceRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/uploads', uploadRoutes);

app.use(notFound);
app.use(errorHandler);

const startServer = async () => {
  try {
    await connectDB();
    await connectRedis();
    
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 API: http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

export { app, startServer, PORT };

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  startServer();
}
