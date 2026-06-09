import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

import { requestLogger, setResponseMetadata, generalLimiter } from './middleware/monitor.js';
import './db/database.js';

import authRoutes from './routes/auth.js';
import meetingRoutes from './routes/meetings.js';
import actionItemRoutes from './routes/action-items.js';
import milestoneRoutes from './routes/milestones.js';
import evaluationRoutes from './routes/evaluation.js';
import trainingRoutes from './routes/training.js';
import adminRoutes from './routes/admin.js';
import sampleRoutes from './routes/samples.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app: express.Application = express();

app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use(setResponseMetadata);
app.use(generalLimiter);
app.use(requestLogger);

/**
 * API Routes
 */
app.use('/api/auth', authRoutes);
app.use('/api/meetings', meetingRoutes);
app.use('/api/action-items', actionItemRoutes);
app.use('/api/milestones', milestoneRoutes);
app.use('/api/evaluation', evaluationRoutes);
app.use('/api/training', trainingRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/samples', sampleRoutes);

/**
 * health
 */
app.get(
  '/api/health',
  (_req: Request, res: Response): void => {
    res.status(200).json({
      success: true,
      message: 'ok',
      timestamp: new Date().toISOString(),
    });
  },
);

/**
 * error handler middleware
 */
app.use((error: Error, req: Request, res: Response, _next: NextFunction): void => {
  res.locals.errorMessage = error.message;
  console.error('[API Error]', error);
  res.status(500).json({
    success: false,
    error: 'Server internal error',
    details: process.env.NODE_ENV === 'development' ? error.message : undefined,
  });
});

/**
 * 404 handler
 */
app.use((req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    error: 'API not found',
    path: req.path,
  });
});

export default app;
