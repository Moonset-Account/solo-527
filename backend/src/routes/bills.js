import express from 'express';
import prisma from '../db.js';
import { logChange } from '../utils/changeLog.js';
import dayjs from 'dayjs';

const router = express.Router();

router.get('/', async (req, res) => {
  const { contractId, status, billType } = req.query;
  const where = {};
  if (contractId) where.contractId = contractId;
  if (status) where.status = status;
  if (billType) where.billType = billType;
  const list = await prisma.bill.findMany({
    where,
    include: { contract: { include: { tenant: true, property: true } } },
    orderBy: { dueDate: 'desc' },
  });
  res.json(list);
});

router.get('/overdue', async (req, res) => {
  const now = dayjs().toDate();
  const overdue = await prisma.bill.findMany({
    where: { status: { in: ['PENDING', 'OVERDUE', 'PROCESSING'] }, dueDate: { lt: now }, billType: 'RENT' },
    include: { contract: { include: { tenant: true, property: true } } },
    orderBy: { dueDate: 'asc' },
  });
  res.json(overdue);
});

router.get('/:id', async (req, res) => {
  const bill = await prisma.bill.findUnique({
    where: { id: req.params.id },
    include: { contract: { include: { tenant: true, property: true } } },
  });
  if (!bill) return res.status(404).json({ error: '账单不存在' });
  const changeLogs = await prisma.changeLog.findMany({
    where: { entityType: 'Bill', entityId: req.params.id },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ ...bill, changeLogs });
});

router.put('/:id/pay', async (req, res) => {
  const { operatorId, operatorName } = req.body;
  const before = await prisma.bill.findUnique({ where: { id: req.params.id } });
  if (!before) return res.status(404).json({ error: '账单不存在' });
  const bill = await prisma.bill.update({ where: { id: req.params.id }, data: { status: 'PAID', paidDate: new Date(), overdueDays: 0 } });
  await logChange({ entityType: 'Bill', entityId: bill.id, action: 'PAY', before, after: bill, operatorId, operatorName, remark: '账单已支付' });
  const existingTodo = await prisma.todo.findFirst({ where: { sourceType: 'OVERDUE_RENT', sourceId: before.id, status: { not: 'CLOSED' } } });
  if (existingTodo) {
    await prisma.todo.update({ where: { id: existingTodo.id }, data: { status: 'CLOSED', closedReason: '账单已支付，自动关闭' } });
  }
  res.json(bill);
});

router.put('/:id/mark-overdue', async (req, res) => {
  const { operatorId, operatorName } = req.body;
  const before = await prisma.bill.findUnique({
    where: { id: req.params.id },
    include: { contract: { include: { tenant: true, property: true } } },
  });
  if (!before) return res.status(404).json({ error: '账单不存在' });
  const overdueDays = dayjs().diff(dayjs(before.dueDate), 'day');
  const bill = await prisma.bill.update({ where: { id: req.params.id }, data: { status: 'OVERDUE', overdueDays } });
  await logChange({ entityType: 'Bill', entityId: bill.id, action: 'MARK_OVERDUE', before, after: bill, operatorId, operatorName, remark: `标记逾期，逾期天数: ${overdueDays}` });
  const existingTodo = await prisma.todo.findFirst({ where: { sourceType: 'OVERDUE_RENT', sourceId: before.id, status: { not: 'CLOSED' } } });
  if (!existingTodo) {
    const contract = before.contract;
    await prisma.todo.create({
      data: {
        sourceType: 'OVERDUE_RENT',
        sourceId: before.id,
        title: `租金逾期 - ${contract?.tenant?.name || '未知租客'} - ${contract?.property?.title || '未知房源'}`,
        description: `租金账单已逾期 ${overdueDays} 天，金额: ${before.amount}`,
        priority: overdueDays > 30 ? 'URGENT' : overdueDays > 7 ? 'HIGH' : 'MEDIUM',
        status: 'OPEN',
        assignedTo: contract?.consultantId,
        dueDate: dayjs().add(3, 'day').toDate(),
      },
    });
  }
  res.json(bill);
});

router.get('/:id/history', async (req, res) => {
  const logs = await prisma.changeLog.findMany({
    where: { entityType: 'Bill', entityId: req.params.id },
    orderBy: { createdAt: 'desc' },
  });
  res.json(logs);
});

export default router;
