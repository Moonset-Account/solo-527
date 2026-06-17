import { Hono } from 'hono';
import { cors } from 'hono/cors';
import commonRoutes from './routes/common';
import zoneRoutes from './routes/zones';
import meterRoutes from './routes/meters';
import deviceRoutes from './routes/devices';
import alertRoutes from './routes/alerts';
import subsidyRoutes from './routes/subsidies';
import targetRoutes from './routes/targets';
import offlineRoutes from './routes/offline';
import miscRoutes from './routes/misc';
import exportRoutes from './routes/export';

const app = new Hono();

app.use('*', cors({ origin: '*', allowHeaders: ['*'], allowMethods: ['*'] }));

app.use('*', async (c, next) => {
  const start = Date.now();
  await next();
  const ms = Date.now() - start;
  c.header('X-Response-Time', `${ms}ms`);
});

app.get('/health', (c) => c.json({ success: true, data: { status: 'ok', timestamp: new Date().toISOString() } }));

app.route('/api/common', commonRoutes);
app.route('/api/zones', zoneRoutes);
app.route('/api/meters', meterRoutes);
app.route('/api/devices', deviceRoutes);
app.route('/api/alerts', alertRoutes);
app.route('/api/subsidies', subsidyRoutes);
app.route('/api/targets', targetRoutes);
app.route('/api/offline', offlineRoutes);
app.route('/api/misc', miscRoutes);
app.route('/api/export', exportRoutes);

app.notFound((c) => c.json({ success: false, error: 'Not Found', path: c.req.path }, 404));
app.onError((err, c) => {
  console.error(err);
  return c.json({ success: false, error: err.message || 'Internal Server Error' }, 500);
});

const PORT = Number(process.env.PORT || 52876);
console.log(`Solar Dashboard API starting on port ${PORT}...`);

import { serve } from '@hono/node-server';

export default app;

if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'test') {
  serve({
    fetch: app.fetch,
    port: PORT,
    hostname: '127.0.0.1',
  });
  setTimeout(() => {
    console.log(`[Hono] Solar Dashboard API is running on http://127.0.0.1:${PORT}`);
  }, 200);
}
