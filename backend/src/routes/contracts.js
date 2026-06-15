import express from 'express';
import prisma from '../db.js';
import { logChange } from '../utils/changeLog.js';

const router = express.Router();

router.get('/', async (req, res) => {
  const { reviewStatus, signStatus, tenantId, propertyId } = req.query;
  const where = {};
  if (reviewStatus) where.reviewStatus = reviewStatus;
  if (signStatus) where.signStatus = signStatus;
  if (tenantId) where.tenantId = tenantId;
  if (propertyId) where.propertyId = propertyId;
  const list = await prisma.contract.findMany({
    where,
    include: { tenant: true, property: true, consultant: true, bills: true },
    orderBy: { updatedAt: 'desc' },
  });
  res.json(list);
});

router.get('/stats/signing-progress', async (req, res) => {
  const total = await prisma.contract.count();
  const byReview = await prisma.contract.groupBy({ by: ['reviewStatus'], _count: true });
  const bySign = await prisma.contract.groupBy({ by: ['signStatus'], _count: true });
  const reviewMap = {};
  byReview.forEach(r => { reviewMap[r.reviewStatus] = r._count; });
  const signMap = {};
  bySign.forEach(r => { signMap[r.signStatus] = r._count; });
  res.json({ total, byReviewStatus: reviewMap, bySignStatus: signMap });
});

router.get('/:id', async (req, res) => {
  const contract = await prisma.contract.findUnique({
    where: { id: req.params.id },
    include: {
      tenant: true,
      property: true,
      consultant: true,
      bills: { orderBy: { dueDate: 'asc' } },
    },
  });
  if (!contract) return res.status(404).json({ error: '合同不存在' });
  const changeLogs = await prisma.changeLog.findMany({
    where: { entityType: 'Contract', entityId: req.params.id },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ ...contract, changeLogs });
});

router.post('/', async (req, res) => {
  const data = req.body;
  const contract = await prisma.contract.create({ data });
  await logChange({
    entityType: 'Contract',
    entityId: contract.id,
    action: 'CREATE',
    after: contract,
    operatorId: data.operatorId,
    operatorName: data.operatorName,
  });
  await prisma.property.update({
    where: { id: data.propertyId },
    data: { status: 'RESERVED' },
  });
  res.json(contract);
});

router.put('/:id/review', async (req, res) => {
  const { reviewStatus, rejectReason, operatorId, operatorName } = req.body;
  const before = await prisma.contract.findUnique({ where: { id: req.params.id } });
  if (!before) return res.status(404).json({ error: '合同不存在' });
  if (reviewStatus === 'REJECTED' && !rejectReason) {
    return res.status(400).json({ error: '驳回时必须填写驳回原因' });
  }
  const updateData = { reviewStatus };
  if (rejectReason) updateData.rejectReason = rejectReason;
  const contract = await prisma.contract.update({ where: { id: req.params.id }, data: updateData });
  await logChange({
    entityType: 'Contract',
    entityId: contract.id,
    action: 'REVIEW',
    before,
    after: contract,
    operatorId,
    operatorName,
    remark: `合同审核: ${before.reviewStatus} -> ${reviewStatus}${rejectReason ? `，原因: ${rejectReason}` : ''}`,
  });
  if (reviewStatus === 'APPROVED' && before.signStatus === 'PENDING_SIGN') {
    await prisma.contract.update({ where: { id: contract.id }, data: { signStatus: 'SIGNING' } });
  }
  res.json(contract);
});

router.put('/:id/sign', async (req, res) => {
  const { signStatus, operatorId, operatorName } = req.body;
  const before = await prisma.contract.findUnique({ where: { id: req.params.id } });
  if (!before) return res.status(404).json({ error: '合同不存在' });
  const contract = await prisma.contract.update({ where: { id: req.params.id }, data: { signStatus } });
  await logChange({
    entityType: 'Contract',
    entityId: contract.id,
    action: 'SIGN',
    before,
    after: contract,
    operatorId,
    operatorName,
    remark: `签约状态变更: ${before.signStatus} -> ${signStatus}`,
  });
  if (signStatus === 'SIGNED') {
    await prisma.property.update({ where: { id: before.propertyId }, data: { status: 'OCCUPIED' } });
    await prisma.bill.create({
      data: { contractId: contract.id, billType: 'DEPOSIT', amount: before.depositAmount, dueDate: new Date(), status: 'PENDING' },
    });
  }
  res.json(contract);
});

router.put('/:id/attachment', async (req, res) => {
  const { attachmentUrl, operatorId, operatorName } = req.body;
  const before = await prisma.contract.findUnique({ where: { id: req.params.id } });
  if (!before) return res.status(404).json({ error: '合同不存在' });
  const contract = await prisma.contract.update({ where: { id: req.params.id }, data: { attachmentUrl, reviewStatus: 'PENDING_REVIEW' } });
  await logChange({
    entityType: 'Contract',
    entityId: contract.id,
    action: 'ATTACHMENT_UPLOAD',
    before,
    after: contract,
    operatorId,
    operatorName,
    remark: '上传合同附件并提交审核',
  });
  res.json(contract);
});

router.get('/:id/history', async (req, res) => {
  const logs = await prisma.changeLog.findMany({
    where: { entityType: 'Contract', entityId: req.params.id },
    orderBy: { createdAt: 'desc' },
  });
  res.json(logs);
});

export default router;
