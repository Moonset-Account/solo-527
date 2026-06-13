import { Router } from 'express';
import prisma from '../config/prisma.js';
import { authenticate, requireRoles } from '../middleware/auth.js';

const router = Router();

router.get('/', authenticate, requireRoles('FINANCE_STAFF', 'FINANCE_MANAGER', 'ADMIN'), async (req, res) => {
  try {
    const { page = 1, pageSize = 10, status, customerId, startDate, endDate } = req.query;
    const skip = (page - 1) * pageSize;

    const where = {};

    if (status) {
      where.status = status;
    }

    if (customerId) {
      where.customerId = parseInt(customerId);
    }

    if (startDate || endDate) {
      where.transDate = {};
      if (startDate) where.transDate.gte = new Date(startDate);
      if (endDate) where.transDate.lte = new Date(endDate);
    }

    const [list, total] = await Promise.all([
      prisma.bankTransaction.findMany({
        where,
        skip,
        take: parseInt(pageSize),
        include: {
          customer: { select: { id: true, name: true, customerNo: true } },
          matches: true,
        },
        orderBy: { transDate: 'desc' },
      }),
      prisma.bankTransaction.count({ where }),
    ]);

    res.json({
      list,
      total,
      page: parseInt(page),
      pageSize: parseInt(pageSize),
    });
  } catch (error) {
    console.error('获取银行流水列表失败:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
});

router.get('/:id', authenticate, requireRoles('FINANCE_STAFF', 'FINANCE_MANAGER', 'ADMIN'), async (req, res) => {
  try {
    const transaction = await prisma.bankTransaction.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        customer: true,
        matches: {
          include: {
            bill: { select: { id: true, billNo: true } },
            payment: { select: { id: true, paymentNo: true } },
            matchedBy: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!transaction) {
      return res.status(404).json({ message: '银行流水不存在' });
    }

    res.json({ transaction });
  } catch (error) {
    console.error('获取银行流水详情失败:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
});

router.post('/:id/match', authenticate, requireRoles('FINANCE_STAFF', 'FINANCE_MANAGER', 'ADMIN'), async (req, res) => {
  try {
    const transactionId = parseInt(req.params.id);
    const { billId, paymentId, matchAmount, matchType, remark } = req.body;

    const transaction = await prisma.bankTransaction.findUnique({
      where: { id: transactionId },
    });

    if (!transaction) {
      return res.status(404).json({ message: '银行流水不存在' });
    }

    const match = await prisma.transactionMatch.create({
      data: {
        transactionId,
        billId: billId ? parseInt(billId) : null,
        paymentId: paymentId ? parseInt(paymentId) : null,
        matchAmount,
        matchType,
        remark,
        matchedById: req.user.id,
      },
      include: {
        bill: true,
        payment: true,
      },
    });

    const newMatchedAmount = parseFloat(transaction.matchedAmount) + parseFloat(matchAmount);
    const remaining = parseFloat(transaction.amount) - newMatchedAmount;

    let status = 'MATCHED';
    if (remaining > 0.01) {
      status = 'PARTIAL_MATCHED';
    } else if (remaining < -0.01) {
      status = 'EXCESS';
    }

    await prisma.bankTransaction.update({
      where: { id: transactionId },
      data: {
        matchedAmount: newMatchedAmount,
        status,
      },
    });

    res.json({ match });
  } catch (error) {
    console.error('流水匹配失败:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
});

router.post('/:id/unmatch', authenticate, requireRoles('FINANCE_MANAGER', 'ADMIN'), async (req, res) => {
  try {
    const { matchId } = req.body;

    const match = await prisma.transactionMatch.findUnique({
      where: { id: parseInt(matchId) },
      include: { transaction: true },
    });

    if (!match) {
      return res.status(404).json({ message: '匹配记录不存在' });
    }

    await prisma.transactionMatch.delete({
      where: { id: parseInt(matchId) },
    });

    const newMatchedAmount = parseFloat(match.transaction.matchedAmount) - parseFloat(match.matchAmount);
    const remaining = parseFloat(match.transaction.amount) - newMatchedAmount;

    let status = 'UNMATCHED';
    if (newMatchedAmount > 0.01 && remaining > 0.01) {
      status = 'PARTIAL_MATCHED';
    } else if (Math.abs(remaining) <= 0.01) {
      status = 'MATCHED';
    }

    await prisma.bankTransaction.update({
      where: { id: match.transactionId },
      data: {
        matchedAmount: Math.max(0, newMatchedAmount),
        status,
      },
    });

    res.json({ message: '取消匹配成功' });
  } catch (error) {
    console.error('取消匹配失败:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
});

router.post('/import', authenticate, requireRoles('FINANCE_STAFF', 'FINANCE_MANAGER', 'ADMIN'), async (req, res) => {
  try {
    const { transactions } = req.body;

    const created = [];
    for (const trans of transactions) {
      const transNo = trans.transNo || `TRX${Date.now()}${Math.random().toString(36).slice(2, 6)}`;
      try {
        const t = await prisma.bankTransaction.create({
          data: {
            transNo,
            amount: trans.amount,
            transDate: new Date(trans.transDate),
            transType: trans.transType || 'INCOME',
            counterparty: trans.counterparty,
            bankAccount: trans.bankAccount,
            summary: trans.summary,
            remark: trans.remark,
          },
        });
        created.push(t);
      } catch (e) {
        if (e.code !== 'P2002') throw e;
      }
    }

    res.json({ count: created.length, transactions: created });
  } catch (error) {
    console.error('导入流水失败:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
});

export default router;
