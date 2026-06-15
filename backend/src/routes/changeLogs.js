import express from 'express';
import prisma from '../db.js';

const router = express.Router();

router.get('/', async (req, res) => {
  const { entityType, entityId, action } = req.query;
  const where = {};
  if (entityType) where.entityType = entityType;
  if (entityId) where.entityId = entityId;
  if (action) where.action = action;
  const logs = await prisma.changeLog.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
  res.json(logs);
});

router.get('/:entityType/:entityId', async (req, res) => {
  const { entityType, entityId } = req.params;
  const logs = await prisma.changeLog.findMany({
    where: { entityType, entityId },
    orderBy: { createdAt: 'desc' },
  });
  res.json(logs);
});

export default router;
