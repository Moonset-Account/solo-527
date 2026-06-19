import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { serve } from '@hono/node-server';
import ordersRouter from './routes/orders';
import refundsRouter from './routes/refunds';
import techniciansRouter from './routes/technicians';
import reviewsRouter from './routes/reviews';
import rescheduleRouter from './routes/reschedule';
import analyticsRouter from './routes/analytics';

const app = new Hono();

app.use('*', logger());
app.use('*', cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  allowHeaders: ['Content-Type', 'Authorization'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
}));

app.get('/api/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.route('/api/orders', ordersRouter);
app.route('/api/refunds', refundsRouter);
app.route('/api/technicians', techniciansRouter);
app.route('/api/reviews', reviewsRouter);
app.route('/api/reschedule', rescheduleRouter);
app.route('/api/analytics', analyticsRouter);

const port = Number(process.env.PORT) || 3001;

console.log(`🚀 Server is running on http://localhost:${port}`);

serve({
  fetch: app.fetch,
  port,
});
