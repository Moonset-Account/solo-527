import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { cache } from 'hono/cache';
import { prettyJSON } from 'hono/pretty-json';
import 'dotenv/config';

import { campsRouter } from './routes/camps';
import { chaptersRouter } from './routes/chapters';
import { membersRouter } from './routes/members';
import { checkinsRouter } from './routes/checkins';
import { refundsRouter } from './routes/refunds';
import { benefitsRouter } from './routes/benefits';
import { todosRouter } from './routes/todos';
import { statsRouter } from './routes/stats';
import { exportRouter } from './routes/export';
import { usersRouter } from './routes/users';

const app = new Hono();

app.use('*', logger());
app.use('*', prettyJSON());
app.use(
  '*',
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    allowHeaders: ['Content-Type', 'Authorization'],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    credentials: true,
  }),
);

app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

app.get(
  '/api/health',
  cache({
    cacheName: 'api-cache',
    cacheControl: 'max-age=10',
  }),
  (c) => c.json({ status: 'ok', service: 'training-camp-api' }),
);

const api = new Hono();

api.route('/camps', campsRouter);
api.route('/chapters', chaptersRouter);
api.route('/members', membersRouter);
api.route('/checkins', checkinsRouter);
api.route('/refunds', refundsRouter);
api.route('/benefits', benefitsRouter);
api.route('/todos', todosRouter);
api.route('/stats', statsRouter);
api.route('/export', exportRouter);
api.route('/users', usersRouter);

app.route('/api', api);

app.notFound((c) => {
  return c.json({ message: 'Not Found', path: c.req.path }, 404);
});

app.onError((err, c) => {
  console.error('Unhandled error:', err);
  return c.json(
    {
      message: 'Internal Server Error',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined,
    },
    500,
  );
});

const port = parseInt(process.env.PORT || '3001', 10);
const host = process.env.HOST || '0.0.0.0';

console.log(`🚀 Starting server on http://${host}:${port}`);

export default {
  port,
  fetch: app.fetch,
};
