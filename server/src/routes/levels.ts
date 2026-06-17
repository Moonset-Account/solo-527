import { Hono } from 'hono';
import { getMemberLevels, getMemberLevelById } from '../services/common';
import { createMemberLevel, updateMemberLevel, deleteMemberLevel } from '../services/member';
import { setAuditAction } from '../middleware/audit';
import { requireRole } from '../middleware/auth';

const levels = new Hono();

levels.get('/', async (c) => {
  const levels = await getMemberLevels();
  return c.json({ success: true, data: levels });
});

levels.get('/:id', async (c) => {
  const id = c.req.param('id');
  const level = await getMemberLevelById(id);

  if (!level) {
    return c.json({ success: false, error: '等级不存在' }, 404);
  }

  return c.json({ success: true, data: level });
});

levels.post('/', requireRole('admin'), async (c) => {
  const body = await c.req.json();

  if (!body.name || body.minGrowth === undefined) {
    return c.json({ success: false, error: '等级名称和成长值门槛不能为空' }, 400);
  }

  const level = await createMemberLevel({
    name: body.name,
    minGrowth: Number(body.minGrowth),
    icon: body.icon,
    benefits: body.benefits,
    sortOrder: body.sortOrder !== undefined ? Number(body.sortOrder) : undefined,
  });

  setAuditAction(c, 'level.create', {
    resourceType: 'level',
    resourceId: level.id,
    details: { name: level.name },
  });

  return c.json({ success: true, data: level });
});

levels.put('/:id', requireRole('admin'), async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();

  const level = await updateMemberLevel(id, {
    name: body.name,
    minGrowth: body.minGrowth !== undefined ? Number(body.minGrowth) : undefined,
    icon: body.icon,
    benefits: body.benefits,
    sortOrder: body.sortOrder !== undefined ? Number(body.sortOrder) : undefined,
  });

  setAuditAction(c, 'level.update', {
    resourceType: 'level',
    resourceId: id,
    details: body,
  });

  return c.json({ success: true, data: level });
});

levels.delete('/:id', requireRole('admin'), async (c) => {
  const id = c.req.param('id');
  const success = await deleteMemberLevel(id);

  setAuditAction(c, 'level.delete', {
    resourceType: 'level',
    resourceId: id,
  });

  return c.json({ success });
});

export default levels;
