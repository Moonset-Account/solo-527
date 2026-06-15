import express from 'express';
import prisma from '../db.js';
import { logChange } from '../utils/changeLog.js';

const router = express.Router();

router.get('/', async (req, res) => {
  const list = await prisma.tenant.findMany({
    include: { viewings: { take: 5, orderBy: { createdAt: 'desc' } }, contracts: { take: 3 } },
    orderBy: { updatedAt: 'desc' },
  });
  res.json(list);
});

router.get('/:id', async (req, res) => {
  const tenant = await prisma.tenant.findUnique({
    where: { id: req.params.id },
    include: {
      viewings: { include: { property: true, consultant: true } },
      contracts: { include: { property: true, bills: true } },
    },
  });
  if (!tenant) return res.status(404).json({ error: '租客不存在' });
  const changeLogs = await prisma.changeLog.findMany({
    where: { entityType: 'Tenant', entityId: req.params.id },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ ...tenant, changeLogs });
});

router.post('/', async (req, res) => {
  const data = req.body;
  const tenant = await prisma.tenant.create({ data });
  await logChange({
    entityType: 'Tenant',
    entityId: tenant.id,
    action: 'CREATE',
    after: tenant,
    operatorId: data.operatorId,
    operatorName: data.operatorName,
  });
  res.json(tenant);
});

router.put('/:id', async (req, res) => {
  const before = await prisma.tenant.findUnique({ where: { id: req.params.id } });
  if (!before) return res.status(404).json({ error: '租客不存在' });
  const data = req.body;
  const tenant = await prisma.tenant.update({ where: { id: req.params.id }, data });
  await logChange({
    entityType: 'Tenant',
    entityId: tenant.id,
    action: 'UPDATE',
    before,
    after: tenant,
    operatorId: data.operatorId,
    operatorName: data.operatorName,
  });
  res.json(tenant);
});

export default router;
