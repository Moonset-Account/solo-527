import { Hono } from 'hono';
import { cors } from '@hono/cors';
import { petRoutes } from './routes/pets';
import { fosteringRoutes } from './routes/fostering';
import { recordRoutes } from './routes/records';
import { scheduleRoutes } from './routes/schedules';
import { receiptRoutes } from './routes/receipts';
import { callbackRoutes } from './routes/callbacks';

const app = new Hono();

app.use(
  '*',
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
  })
);

app.get('/health', (c) => c.json({ status: 'ok' }));

app.route('/api/pets', petRoutes);
app.route('/api/fostering', fosteringRoutes);
app.route('/api/records', recordRoutes);
app.route('/api/schedules', scheduleRoutes);
app.route('/api/receipts', receiptRoutes);
app.route('/api/callbacks', callbackRoutes);

const port = parseInt(process.env.PORT || '3001');
console.log(`Server running on port ${port}`);

export default {
  port,
  fetch: app.fetch,
};
