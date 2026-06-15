import express from 'express';
import prisma from '../db.js';
import { logChange } from '../utils/changeLog.js';

const router = express.Router();

router.get('/', async (req, res) => {
  const { status, keyword } = req.query;
  const where = {};
  if (status) where.status = status;
  if (keyword) {
    where.OR = [
      { title: { contains: keyword } },
      { address: { contains: keyword } },
    ];
  }
  const list = await prisma.property.findMany({
    where,
    include: { contracts: { where: { signStatus: 'SIGNED' }, take: 1 }, viewings: { take: 3, orderBy: { createdAt: 'desc' } } },
    orderBy: { updatedAt: 'desc' },
  });
  res.json(list);
});

router.get('/stats/vacancy', async (req, res) => {
  const total = await prisma.property.count();
  const vacant = await prisma.property.count({ where: { status: 'VACANT' } });
  const occupied = await prisma.property.count({ where: { status: 'OCCUPIED' } });
  const processing = await prisma.property.count({ where: { status: 'PROCESSING' } });
  const anomalous = await prisma.property.count({ where: { status: 'ANOMALOUS' } });
  const longVacant = await prisma.property.findMany({
    where: { vacancyDays: { gte: 30 }, status: 'VACANT' },
    orderBy: { vacancyDays: 'desc' },
  });
  res.json({ total, vacant, occupied, processing, anomalous, vacancyRate: total ? ((vacant / total) * 100).toFixed(1) : 0, longVacant });
});

router.get('/:id', async (req, res) => {
  const property = await prisma.property.findUnique({
    where: { id: req.params.id },
    include: {
      contracts: { include: { tenant: true, bills: true } },
      viewings: { include: { tenant: true, consultant: true } },
    },
  });
  if (!property) return res.status(404).json({ error: '房源不存在' });
  const changeLogs = await prisma.changeLog.findMany({
    where: { entityType: 'Property', entityId: req.params.id },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ ...property, changeLogs });
});

router.post('/', async (req, res) => {
  const data = req.body;
  const property = await prisma.property.create({ data });
  await logChange({
    entityType: 'Property',
    entityId: property.id,
    action: 'CREATE',
    after: property,
    operatorId: data.operatorId,
    operatorName: data.operatorName,
  });
  res.json(property);
});

router.put('/:id', async (req, res) => {
  const before = await prisma.property.findUnique({ where: { id: req.params.id } });
  if (!before) return res.status(404).json({ error: '房源不存在' });

  const data = req.body;
  if (before.escrowManagerId && !data.escrowManagerId && !data.escrowCloseReason) {
    return res.status(400).json({ error: '房东托管经理关闭时必须填写关闭说明' });
  }

  const property = await prisma.property.update({ where: { id: req.params.id }, data });
  await logChange({
    entityType: 'Property',
    entityId: property.id,
    action: 'UPDATE',
    before,
    after: property,
    operatorId: data.operatorId,
    operatorName: data.operatorName,
  });
  res.json(property);
});

router.get('/:id/history', async (req, res) => {
  const logs = await prisma.changeLog.findMany({
    where: { entityType: 'Property', entityId: req.params.id },
    orderBy: { createdAt: 'desc' },
  });
  res.json(logs);
});

export default router;
