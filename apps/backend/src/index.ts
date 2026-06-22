import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import 'dotenv/config';
import { authRoutes } from './routes/auth';
import { deviceRoutes } from './routes/devices';
import { inspectionRoutes } from './routes/inspections';
import { repairRoutes } from './routes/repairs';
import { logRoutes } from './routes/logs';
import { statsRoutes } from './routes/stats';
import { scheduleRoutes } from './routes/schedules';
import { pricingRoutes } from './routes/pricing';
import { waitlistRoutes } from './routes/waitlist';
import { eventRoutes } from './routes/events';
import { reportRoutes } from './routes/reports';
import { filterRoutes } from './routes/filters';

const app = new Hono();

app.use('*', cors({
  origin: ['http://localhost:5173'],
  credentials: true,
}));

app.get('/', (c) => {
  return c.json({ message: 'Swim Pool Inspection API' });
});

app.route('/api/auth', authRoutes);
app.route('/api/devices', deviceRoutes);
app.route('/api/inspections', inspectionRoutes);
app.route('/api/repairs', repairRoutes);
app.route('/api/logs', logRoutes);
app.route('/api/stats', statsRoutes);
app.route('/api/schedules', scheduleRoutes);
app.route('/api/pricing', pricingRoutes);
app.route('/api/waitlist', waitlistRoutes);
app.route('/api/events', eventRoutes);
app.route('/api/reports', reportRoutes);
app.route('/api/filters', filterRoutes);

const port = Number(process.env.PORT) || 3000;

console.log(`Server is running on port ${port}`);

serve({
  fetch: app.fetch,
  port,
});
