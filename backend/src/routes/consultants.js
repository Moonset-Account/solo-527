import express from 'express';
import prisma from '../db.js';
import { logChange } from '../utils/changeLog.js';

const router = express.Router();

router.get('/', async (req, res) => {
  const list = await prisma.consultant.findMany({
    include: { followUps: { take: 10, orderBy: { createdAt: 'desc' } } },
    orderBy: { updatedAt: 'desc' },
  });
  res.json(list);
});

router.post('/', async (req, res) => {
  const consultant = await prisma.consultant.create({ data: req.body });
  res.json(consultant);
});

router.post('/:id/follow-ups', async (req, res) => {
  const consultantId = req.params.id;
  const data = { ...req.body, consultantId };
  const followUp = await prisma.consultantFollowUp.create({ data });
  await logChange({
    entityType: 'ConsultantFollowUp',
    entityId: followUp.id,
    action: 'CREATE',
    after: followUp,
    operatorId: consultantId,
    operatorName: data.operatorName,
  });
  res.json(followUp);
});

router.get('/:id/follow-ups', async (req, res) => {
  const { tenantId, propertyId } = req.query;
  const where = { consultantId: req.params.id };
  if (tenantId) where.tenantId = tenantId;
  if (propertyId) where.propertyId = propertyId;
  const list = await prisma.consultantFollowUp.findMany({
    where,
    include: { tenant: true, property: true },
    orderBy: { createdAt: 'desc' },
  });
  res.json(list);
});

export default router;
