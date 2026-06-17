import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { authMiddleware, requireAdminRoles, requireRole } from './middleware/auth';
import { auditLogMiddleware } from './middleware/audit';
import authRoutes from './routes/auth';
import productRoutes from './routes/products';
import orderRoutes from './routes/orders';
import memberRoutes from './routes/members';
import levelRoutes from './routes/levels';
import reachRoutes from './routes/reach';
import statisticsRoutes from './routes/statistics';
import adminRoutes from './routes/admin';

const app = new Hono();

app.use('*', cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
}));

app.get('/api/health', (c) => {
  return c.json({ success: true, message: 'Member Reach Platform API is running' });
});

app.route('/api/auth', authRoutes);
app.route('/api/products', productRoutes);
app.route('/api/member-levels', levelRoutes);

app.use('/api/orders/*', authMiddleware, auditLogMiddleware);
app.route('/api/orders', orderRoutes);

app.use('/api/members/*', authMiddleware);
app.route('/api/members', memberRoutes);

app.use('/api/admin/*', authMiddleware, requireAdminRoles(), auditLogMiddleware);
app.route('/api/admin/products', productRoutes);
app.route('/api/admin/orders', orderRoutes);
app.route('/api/admin/members', memberRoutes);
app.route('/api/admin/member-levels', levelRoutes);
app.route('/api/admin/reach-tasks', reachRoutes);
app.route('/api/admin/statistics', statisticsRoutes);
app.route('/api/admin/users', adminRoutes);
app.route('/api/admin/audit-logs', adminRoutes);

export default app;
