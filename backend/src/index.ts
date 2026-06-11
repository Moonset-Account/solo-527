import 'dotenv/config';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { HTTPException } from 'hono/http-exception';
import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import authRoutes from './routes/auth';
import concertRoutes from './routes/concerts';
import orderRoutes from './routes/orders';
import refundRoutes from './routes/refunds';
import auditRoutes from './routes/audit';
import notificationRoutes from './routes/notifications';
import ticketTypeRoutes, { attendanceApp } from './routes/ticketTypes';

const app = new Hono();

app.use('*', logger());
app.use('*', cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'],
  allowHeaders: ['Content-Type', 'Authorization'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  credentials: true,
}));

app.get('/', (c) => c.json({
  name: 'Concert Ticket System API',
  version: '1.0.0',
  status: 'running',
}));

app.get('/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }));

app.route('/api/auth', authRoutes);
app.route('/api/concerts', concertRoutes);
app.route('/api/orders', orderRoutes);
app.route('/api/refunds', refundRoutes);
app.route('/api/audit', auditRoutes);
app.route('/api/notifications', notificationRoutes);
app.route('/api/ticket-types', ticketTypeRoutes);
app.route('/api/attendance', attendanceApp);

app.onError((err, c) => {
  if (err instanceof HTTPException) {
    return c.json({ error: err.message }, err.status);
  }
  console.error('Unhandled error:', err);
  return c.json({ error: '服务器内部错误', message: err.message }, 500);
});

app.notFound((c) => c.json({ error: '接口不存在', path: c.req.path }, 404));

const PORT = parseInt(process.env.PORT || '3001');

console.log(`Starting server on port ${PORT}...`);

serve({
  fetch: app.fetch,
  port: PORT,
}, (info) => {
  console.log(`Server running at http://localhost:${info.port}`);
});

export default app;
