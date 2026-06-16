import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serve } from '@hono/node-server';
import statsRouter from './routes/stats.js';
import subscriptionsRouter from './routes/subscriptions.js';
import materialsRouter from './routes/materials.js';
import ordersRouter from './routes/orders.js';
import exceptionsRouter from './routes/exceptions.js';
import rulesRouter from './routes/rules.js';
import featuresRouter from './routes/features.js';
import contentRouter from './routes/content.js';
import authRouter from './routes/auth.js';
import usersRouter from './routes/users.js';

const app = new Hono();

app.use('*', cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
}));

app.get('/api/health', (c) => {
  return c.json({ status: 'ok', message: 'Podcast Revenue Dashboard API' });
});

app.route('/api/auth', authRouter);
app.route('/api/users', usersRouter);
app.route('/api/stats', statsRouter);
app.route('/api/subscriptions', subscriptionsRouter);
app.route('/api/materials', materialsRouter);
app.route('/api/orders', ordersRouter);
app.route('/api/exceptions', exceptionsRouter);
app.route('/api/rules', rulesRouter);
app.route('/api/features', featuresRouter);
app.route('/api/content', contentRouter);

const port = Number(process.env.PORT) || 3000;
console.log(`Server is running on port ${port}`);

serve({
  fetch: app.fetch,
  port,
});
