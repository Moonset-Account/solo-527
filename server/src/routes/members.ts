import { Hono } from 'hono';
import { getAdminMembers, adjustMemberPoints, getMemberPointsDetail, recalculateMemberLevel } from '../services/member';
import { getMemberById } from '../services/common';
import { setAuditAction } from '../middleware/audit';

const members = new Hono();

members.get('/', async (c) => {
  const query = c.req.query();
  const result = await getAdminMembers({
    page: query.page ? Number(query.page) : undefined,
    pageSize: query.pageSize ? Number(query.pageSize) : undefined,
    level: query.level,
    keyword: query.keyword,
    minPoints: query.minPoints ? Number(query.minPoints) : undefined,
    maxPoints: query.maxPoints ? Number(query.maxPoints) : undefined,
  });

  return c.json({ success: true, data: result });
});

members.get('/:id', async (c) => {
  const id = c.req.param('id') as string;
  const member = await getMemberById(id);

  if (!member) {
    return c.json({ success: false, error: '会员不存在' }, 404);
  }

  return c.json({ success: true, data: member });
});

members.get('/:id/points', async (c) => {
  const id = c.req.param('id') as string;
  const query = c.req.query();
  const result = await getMemberPointsDetail(id, {
    page: query.page ? Number(query.page) : undefined,
    pageSize: query.pageSize ? Number(query.pageSize) : undefined,
  });

  return c.json({ success: true, data: result });
});

members.post('/:id/points', async (c) => {
  const id = c.req.param('id') as string;
  const body = await c.req.json();

  if (body.points === undefined || !body.reason) {
    return c.json({ success: false, error: '积分和原因不能为空' }, 400);
  }

  try {
    const member = await adjustMemberPoints(id, Number(body.points), body.reason);

    setAuditAction(c, 'member.points.adjust', {
      resourceType: 'member',
      resourceId: id,
      details: { points: body.points, reason: body.reason },
    });

    return c.json({ success: true, data: { points: member.points } });
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 400);
  }
});

members.post('/:id/recalculate-level', async (c) => {
  const id = c.req.param('id') as string;
  const level = await recalculateMemberLevel(id);
  return c.json({ success: true, data: level });
});

export default members;
