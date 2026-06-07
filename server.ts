import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createRequestHandler } from '@remix-run/express';
import { initializeDatabase, closePool } from './api/data/pgDatabase.js';
import { redisCache } from './api/data/redisCache.js';
import dashboardRoutes from './api/routes/dashboard.js';
import exportRoutes from './api/routes/exports.js';
import authRoutes from './api/routes/auth.js';

dotenv.config();

const PORT = process.env.PORT || 399;

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use('/api/auth', authRoutes);
app.use('/api', dashboardRoutes);
app.use('/api/exports', exportRoutes);

app.get('/api/health', async (_req, res) => {
  const { cleanData } = await import('./api/data/pgDatabase.js');
  const cleanResult = await cleanData();
  res.status(200).json({
    success: true,
    message: 'ok',
    dataCleanStatus: cleanResult,
    database: 'postgresql',
    cache: redisCache.isConnected() ? 'redis' : 'memory',
    framework: 'remix+express',
  });
});

app.use(
  '/build',
  express.static('public/build', { immutable: true, maxAge: '1y' })
);
app.use(express.static('public', { maxAge: '1h' }));

app.all(
  '*',
  createRequestHandler({
    // @ts-ignore - Remix build output generated at runtime
    build: await import('./build/index.js').catch(() => {
      console.warn('Remix build not found, serving API only');
      return { default: null };
    }),
  })
);

async function start() {
  try {
    await initializeDatabase();
    console.log('PostgreSQL database initialized');

    await redisCache.ready();
    console.log('Redis cache status:', redisCache.isConnected() ? 'connected' : 'fallback to memory');

    app.listen(PORT, () => {
      console.log(`Server listening on http://localhost:${PORT}`);
      console.log(`Stack: Remix + Express + Redis + PostgreSQL`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

process.on('SIGTERM', async () => {
  await closePool();
  process.exit(0);
});

start();
