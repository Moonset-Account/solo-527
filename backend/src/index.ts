import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import materials from './routes/materials.js';
import tags from './routes/tags.js';
import scripts from './routes/scripts.js';
import schedules from './routes/schedules.js';
import conversions from './routes/conversions.js';
import exceptions from './routes/exceptions.js';
import history from './routes/history.js';
import dashboard from './routes/dashboard.js';

const app = new Hono();

app.use('*', cors());
app.use('*', logger());

app.route('/api/materials', materials);
app.route('/api/tags', tags);
app.route('/api/scripts', scripts);
app.route('/api/schedules', schedules);
app.route('/api/conversions', conversions);
app.route('/api/exceptions', exceptions);
app.route('/api/history', history);
app.route('/api/dashboard', dashboard);

app.get('/api/health', (c) => c.json({ status: 'ok' }));

const port = Number(process.env.PORT) || 3001;

import { serve } from '@hono/node-server';
serve({ fetch: app.fetch, port }, (info) => {
  console.log(`Server running on http://localhost:${info.port}`);
});

export default app;
