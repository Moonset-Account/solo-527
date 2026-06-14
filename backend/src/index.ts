import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';
import { serve } from '@hono/node-server';
import 'dotenv/config';

import authRoutes from './routes/auth';
import workOrderRoutes from './routes/work-orders';
import materialRoutes from './routes/materials';
import processRoutes from './routes/processes';
import reworkRoutes from './routes/reworks';
import timelineRoutes from './routes/timeline';
import dashboardRoutes from './routes/dashboard';
import exportRoutes from './routes/exports';
import logRoutes from './routes/logs';
import userRoutes from './routes/users';

import { jwtAuthMiddleware } from './middleware/auth';

const app = new Hono();

app.use('*', logger());
app.use(
  '*',
  cors({
    origin: [process.env.CORS_ORIGIN || 'http://localhost:5173',
    allowHeaders: ['Authorization', 'Content-Type', 'X-Requested-With'],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
  })
);
app.use('*', prettyJSON());

app.get('/api/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }));

app.route('/api/auth', authRoutes);

app.use('/api/*', jwtAuthMiddleware());

app.route('/api/users', userRoutes);
app.route('/api/work-orders', workOrderRoutes);
app.route('/api/materials', materialRoutes);
app.route('/api/processes', processRoutes);
app.route('/api/reworks', reworkRoutes);
app.route('/api/timeline', timelineRoutes);
app.route('/api/dashboard', dashboardRoutes);
app.route('/api/exports', exportRoutes);
app.route('/api/logs', logRoutes);

app.notFound((c) => c.json({ error: '接口不存在: ' + c.req.method + ' ' + c.req.path }, 404));

app.onError((err, c) => {
  console.error('[Server Error]:', err);
  return c.json({ error: '服务器内部错误', message: err.message }, 500);
});

const PORT = parseInt(process.env.PORT || '3001');

console.log(`🚀 青禾工序排程台 API 服务启动中...`);
console.log(`   端口: ${PORT}`);
console.log(`   健康检查: http://localhost:${PORT}/api/health`);

serve({
  fetch: app.fetch,
  port: PORT,
});

export default app;
