import express from 'express';
import prisma from '../db.js';
import { logChange } from '../utils/changeLog.js';

const router = express.Router();

router.get('/', async (req, res) => {
  const { tenantId, propertyId, status } = req.query;
  const where = {};
  if (tenantId) where.tenantId = tenantId;
  if (propertyId) where.propertyId = propertyId;
  if (status) where.status = status;
  const list = await prisma.viewing.findMany({
    where,
    include: { tenant: true, property: true, consultant: true },
    orderBy: { scheduledAt: 'desc' },
  });
  res.json(list);
});

router.post('/', async (req, res) => {
  const { operatorId, operatorName, ...data } = req.body;
  const viewing = await prisma.viewing.create({
    data,
    include: { tenant: true, property: true, consultant: true },
  });
  await logChange({
    entityType: 'Viewing',
    entityId: viewing.id,
    action: 'CREATE',
    after: viewing,
    operatorId,
    operatorName,
    remark: '创建看房预约',
  });
  res.json(viewing);
});

router.put('/:id', async (req, res) => {
  const before = await prisma.viewing.findUnique({ where: { id: req.params.id } });
  if (!before) return res.status(404).json({ error: '看房记录不存在' });
  const { operatorId, operatorName, ...data } = req.body;
  const viewing = await prisma.viewing.update({
    where: { id: req.params.id },
    data,
    include: { tenant: true, property: true, consultant: true },
  });
  await logChange({
    entityType: 'Viewing',
    entityId: viewing.id,
    action: 'UPDATE',
    before,
    after: viewing,
    operatorId,
    operatorName,
    remark: `看房状态变更: ${before.status} -> ${viewing.status}`,
  });
  res.json(viewing);
});

router.get('/:id/history', async (req, res) => {
  const logs = await prisma.changeLog.findMany({
    where: { entityType: 'Viewing', entityId: req.params.id },
    orderBy: { createdAt: 'desc' },
  });
  res.json(logs);
});

export default router;
