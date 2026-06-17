import { Hono } from 'hono';
import { getAdminUsers, createAdminUser, updateAdminUser, getAuditLogs } from '../services/admin';
import { requireRole } from '../middleware/auth';
import { setAuditAction } from '../middleware/audit';

const admin = new Hono();

admin.get('/users', requireRole('admin'), async (c) => {
  const users = await getAdminUsers();
  return c.json({ success: true, data: users });
});

admin.post('/users', requireRole('admin'), async (c) => {
  const body = await c.req.json();

  if (!body.username || !body.password || !body.role) {
    return c.json({ success: false, error: '用户名、密码和角色不能为空' }, 400);
  }

  try {
    const user = await createAdminUser({
      username: body.username,
      password: body.password,
      role: body.role as 'ecommerce' | 'admin',
    });

    setAuditAction(c, 'admin.create', {
      resourceType: 'admin_user',
      resourceId: user.id,
      details: { username: user.username, role: user.role },
    });

    return c.json({ success: true, data: user });
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 400);
  }
});

admin.put('/users/:id', requireRole('admin'), async (c) => {
  const id = c.req.param('id') as string;
  const body = await c.req.json();

  const user = await updateAdminUser(id, {
    role: body.role as 'ecommerce' | 'admin' | undefined,
    status: body.status as 'active' | 'inactive' | undefined,
    password: body.password,
  });

  setAuditAction(c, 'admin.update', {
    resourceType: 'admin_user',
    resourceId: id,
    details: body,
  });

  return c.json({ success: true, data: user });
});

admin.get('/audit-logs', requireRole('admin'), async (c) => {
  const query = c.req.query();
  const result = await getAuditLogs({
    page: query.page ? Number(query.page) : undefined,
    pageSize: query.pageSize ? Number(query.pageSize) : undefined,
    userId: query.userId,
    action: query.action,
    startDate: query.startDate,
    endDate: query.endDate,
  });

  return c.json({ success: true, data: result });
});

export default admin;
