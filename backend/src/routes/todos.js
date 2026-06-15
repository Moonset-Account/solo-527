import express from 'express';
import prisma from '../db.js';
import dayjs from 'dayjs';

const router = express.Router();

router.get('/', async (req, res) => {
  const { status, sourceType, priority } = req.query;
  const where = {};
  if (status) where.status = status;
  if (sourceType) where.sourceType = sourceType;
  if (priority) where.priority = priority;
  const list = await prisma.todo.findMany({
    where,
    orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
  });
  res.json(list);
});

router.get('/stats', async (req, res) => {
  const total = await prisma.todo.count();
  const open = await prisma.todo.count({ where: { status: 'OPEN' } });
  const inProgress = await prisma.todo.count({ where: { status: 'IN_PROGRESS' } });
  const pendingConfirm = await prisma.todo.count({ where: { status: 'PENDING_CONFIRM' } });
  const bySourceType = await prisma.todo.groupBy({ by: ['sourceType'], _count: true });
  const byPriority = await prisma.todo.groupBy({ by: ['priority'], _count: true });
  res.json({ total, open, inProgress, pendingConfirm, bySourceType, byPriority });
});

router.get('/:id', async (req, res) => {
  const todo = await prisma.todo.findUnique({ where: { id: req.params.id } });
  if (!todo) return res.status(404).json({ error: '待办不存在' });
  res.json(todo);
});

router.put('/:id', async (req, res) => {
  const data = req.body;
  const todo = await prisma.todo.update({ where: { id: req.params.id }, data });
  res.json(todo);
});

router.put('/:id/close', async (req, res) => {
  const { closedReason, operatorId } = req.body;
  if (!closedReason) {
    return res.status(400).json({ error: '关闭待办时必须填写说明' });
  }
  const todo = await prisma.todo.update({
    where: { id: req.params.id },
    data: { status: 'CLOSED', closedReason },
  });
  res.json(todo);
});

router.post('/scan-overdue', async (req, res) => {
  const now = dayjs().toDate();
  const overdueBills = await prisma.bill.findMany({
    where: { status: { in: ['PENDING', 'PROCESSING'] }, dueDate: { lt: now }, billType: 'RENT' },
    include: { contract: { include: { tenant: true, property: true } } },
  });
  let created = 0;
  for (const bill of overdueBills) {
    const existing = await prisma.todo.findFirst({
      where: { sourceType: 'OVERDUE_RENT', sourceId: bill.id, status: { not: 'CLOSED' } },
    });
    if (!existing) {
      const overdueDays = dayjs().diff(dayjs(bill.dueDate), 'day');
      await prisma.todo.create({
        data: {
          sourceType: 'OVERDUE_RENT',
          sourceId: bill.id,
          title: `租金逾期 - ${bill.contract?.tenant?.name || '未知'} - ${bill.contract?.property?.title || '未知'}`,
          description: `租金账单已逾期 ${overdueDays} 天，金额: ${bill.amount}`,
          priority: overdueDays > 30 ? 'URGENT' : overdueDays > 7 ? 'HIGH' : 'MEDIUM',
          status: 'OPEN',
          assignedTo: bill.contract?.consultantId,
          dueDate: dayjs().add(3, 'day').toDate(),
        },
      });
      await prisma.bill.update({ where: { id: bill.id }, data: { status: 'OVERDUE', overdueDays } });
      created++;
    }
  }
  res.json({ scanned: overdueBills.length, created });
});

export default router;
