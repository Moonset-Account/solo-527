import { Hono } from 'hono';
import {
  getReachTasks,
  getReachTaskById,
  createReachTask,
  updateReachTask,
  verifyReachTask,
  executeReachTask,
  getReachLogs,
  retryFailedReach,
} from '../services/reach';
import { setAuditAction } from '../middleware/audit';

const reach = new Hono();

reach.get('/', async (c) => {
  const query = c.req.query();
  const result = await getReachTasks({
    page: query.page ? Number(query.page) : undefined,
    pageSize: query.pageSize ? Number(query.pageSize) : undefined,
    status: query.status,
  });

  return c.json({ success: true, data: result });
});

reach.get('/:id', async (c) => {
  const id = c.req.param('id');
  const task = await getReachTaskById(id);

  if (!task) {
    return c.json({ success: false, error: '任务不存在' }, 404);
  }

  return c.json({ success: true, data: task });
});

reach.post('/', async (c) => {
  const user = c.get('user');
  const body = await c.req.json();

  if (!body.name || !body.type) {
    return c.json({ success: false, error: '任务名称和类型不能为空' }, 400);
  }

  const task = await createReachTask({
    name: body.name,
    type: body.type,
    filterCriteria: body.filterCriteria,
    createdBy: user.id,
  });

  setAuditAction(c, 'reach.create', {
    resourceType: 'reach_task',
    resourceId: task.id,
    details: { name: task.name },
  });

  return c.json({ success: true, data: task });
});

reach.put('/:id', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();

  const task = await updateReachTask(id, {
    name: body.name,
    type: body.type,
    filterCriteria: body.filterCriteria || undefined,
  });

  return c.json({ success: true, data: task });
});

reach.post('/:id/verify', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();

  try {
    const result = await verifyReachTask(id, body.filterCriteria || {});
    return c.json({ success: true, data: result });
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 400);
  }
});

reach.post('/:id/execute', async (c) => {
  const id = c.req.param('id');

  try {
    const result = await executeReachTask(id);

    setAuditAction(c, 'reach.execute', {
      resourceType: 'reach_task',
      resourceId: id,
      details: result,
    });

    return c.json({ success: true, data: result });
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 400);
  }
});

reach.get('/:id/logs', async (c) => {
  const id = c.req.param('id');
  const query = c.req.query();

  const result = await getReachLogs(id, {
    status: query.status,
    page: query.page ? Number(query.page) : undefined,
    pageSize: query.pageSize ? Number(query.pageSize) : undefined,
  });

  return c.json({ success: true, data: result });
});

reach.post('/:id/retry', async (c) => {
  const id = c.req.param('id');

  try {
    const result = await retryFailedReach(id);

    setAuditAction(c, 'reach.retry', {
      resourceType: 'reach_task',
      resourceId: id,
      details: result,
    });

    return c.json({ success: true, data: result });
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 400);
  }
});

export default reach;
