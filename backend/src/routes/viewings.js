import express from 'express';
import prisma from '../db.js';

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
  const viewing = await prisma.viewing.create({ data: req.body });
  res.json(viewing);
});

router.put('/:id', async (req, res) => {
  const before = await prisma.viewing.findUnique({ where: { id: req.params.id } });
  if (!before) return res.status(404).json({ error: '看房记录不存在' });
  const viewing = await prisma.viewing.update({ where: { id: req.params.id }, data: req.body });
  res.json(viewing);
});

export default router;
