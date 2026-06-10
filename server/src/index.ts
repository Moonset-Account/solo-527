import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import authRoutes from './routes/auth';
import apartmentRoutes from './routes/apartments';
import customerRoutes from './routes/customers';
import viewingRoutes from './routes/viewings';
import followupRoutes from './routes/followups';
import leaseRoutes from './routes/leases';
import depositRoutes from './routes/deposits';
import reminderRoutes from './routes/reminders';
import todoRoutes from './routes/todos';
import reportRoutes from './routes/reports';
import userRoutes from './routes/users';

const app = new Hono();

app.use('*', logger());
app.use('*', cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
}));

app.get('/health', (c) => c.json({ status: 'ok' }));

app.route('/api/auth', authRoutes);
app.route('/api/apartments', apartmentRoutes);
app.route('/api/customers', customerRoutes);
app.route('/api/viewings', viewingRoutes);
app.route('/api/followups', followupRoutes);
app.route('/api/leases', leaseRoutes);
app.route('/api/deposits', depositRoutes);
app.route('/api/reminders', reminderRoutes);
app.route('/api/todos', todoRoutes);
app.route('/api/reports', reportRoutes);
app.route('/api/users', userRoutes);

app.onError((err, c) => {
  console.error(err);
  return c.json({ error: err.message || '服务器内部错误' }, 500);
});

const port = parseInt(process.env.PORT || '3001');
console.log(`Server running on http://localhost:${port}`);

export default app;
