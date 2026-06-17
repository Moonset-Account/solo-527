const express = require('express');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { storeId, flowType, startDate, endDate } = req.query;
    const where = {};
    if (storeId) where.storeId = parseInt(storeId);
    if (flowType) where.flowType = flowType;
    if (startDate || endDate) {
      where.occurredAt = {};
      if (startDate) where.occurredAt.gte = new Date(startDate);
      if (endDate) where.occurredAt.lte = new Date(endDate);
    }

    const cashFlows = await prisma.cashFlow.findMany({
      where,
      include: { store: true },
      orderBy: { occurredAt: 'desc' },
    });
    res.json(cashFlows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/summary', async (req, res) => {
  try {
    const { storeId, startDate, endDate } = req.query;
    const where = {};
    if (storeId) where.storeId = parseInt(storeId);
    if (startDate || endDate) {
      where.occurredAt = {};
      if (startDate) where.occurredAt.gte = new Date(startDate);
      if (endDate) where.occurredAt.lte = new Date(endDate);
    }

    const cashFlows = await prisma.cashFlow.findMany({ where });
    const summary = {
      totalIncome: 0,
      totalExpense: 0,
      pettyCashIn: 0,
      pettyCashOut: 0,
      netCashFlow: 0,
    };

    cashFlows.forEach((flow) => {
      switch (flow.flowType) {
        case 'INCOME':
          summary.totalIncome += flow.amount;
          break;
        case 'EXPENSE':
          summary.totalExpense += flow.amount;
          break;
        case 'PETTY_CASH_IN':
          summary.pettyCashIn += flow.amount;
          break;
        case 'PETTY_CASH_OUT':
          summary.pettyCashOut += flow.amount;
          break;
      }
    });

    summary.netCashFlow = summary.totalIncome - summary.totalExpense + summary.pettyCashIn - summary.pettyCashOut;
    res.json(summary);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const cashFlow = await prisma.cashFlow.create({
      data: {
        ...req.body,
        occurredAt: new Date(req.body.occurredAt),
      },
    });
    res.json(cashFlow);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const cashFlow = await prisma.cashFlow.update({
      where: { id: parseInt(req.params.id) },
      data: {
        ...req.body,
        occurredAt: req.body.occurredAt ? new Date(req.body.occurredAt) : undefined,
      },
    });
    res.json(cashFlow);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await prisma.cashFlow.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ message: '删除成功' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
