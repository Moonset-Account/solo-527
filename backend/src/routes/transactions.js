import { Router } from 'express';
import prisma from '../config/prisma.js';
import { authenticate, requireRoles } from '../middleware/auth.js';
import { generatePaymentNo } from '../utils/generators.js';
import { createTimelineEvent } from '../utils/timeline.js';

const router = Router();

router.get('/', authenticate, requireRoles('FINANCE_STAFF', 'FINANCE_MANAGER', 'ADMIN'), async (req, res) => {
  try {
    const { page = 1, pageSize = 10, status, customerId, startDate, endDate } = req.query;
    const skip = (page - 1) * pageSize;

    const where = {};

    if (status) {
      const statuses = Array.isArray(status) ? status : status.split(',');
      where.status = statuses.length > 1 ? { in: statuses } : statuses[0];
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
        matchAmount: parseFloat(matchAmount),
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

    if (billId) {
      const resolvedBillId = parseInt(billId);
      const matchedBill = await prisma.bill.findUnique({
        where: { id: resolvedBillId },
        select: { id: true, totalAmount: true, paidAmount: true, balanceAmount: true, customerId: true },
      });

      if (matchedBill) {
        const newPaidAmount = parseFloat(matchedBill.paidAmount) + parseFloat(matchAmount);
        const newBalance = parseFloat(matchedBill.totalAmount) - newPaidAmount;
        let billStatus = 'PARTIAL_PAID';
        if (newBalance <= 0) {
          billStatus = 'PAID';
        } else if (newBalance < parseFloat(matchedBill.totalAmount)) {
          billStatus = 'PARTIAL_PAID';
        }

        await prisma.bill.update({
          where: { id: resolvedBillId },
          data: {
            paidAmount: newPaidAmount,
            balanceAmount: Math.max(0, newBalance),
            status: billStatus,
            lastHandler: req.user.name,
            lastHandleTime: new Date(),
          },
        });

        await createTimelineEvent({
          billId: resolvedBillId,
          transactionMatchId: match.id,
          eventType: 'PAYMENT_RECEIVED',
          eventName: '流水匹配收款',
          description: `银行流水 ${transaction.transNo} 匹配收款 ¥${parseFloat(matchAmount).toLocaleString()}，匹配单号：MATCH-${match.id}`,
          operatorId: req.user.id,
          operatorName: req.user.name,
        });
      }
    }

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

    if (match.billId) {
      const unmatchBill = await prisma.bill.findUnique({
        where: { id: match.billId },
        select: { id: true, totalAmount: true, paidAmount: true, balanceAmount: true },
      });
      if (unmatchBill) {
        const newPaid = Math.max(0, parseFloat(unmatchBill.paidAmount) - parseFloat(match.matchAmount));
        const newBal = parseFloat(unmatchBill.totalAmount) - newPaid;
        let billStatus = 'UNPAID';
        if (newBal <= 0) {
          billStatus = 'PAID';
        } else if (newPaid > 0) {
          billStatus = 'PARTIAL_PAID';
        }
        await prisma.bill.update({
          where: { id: match.billId },
          data: {
            paidAmount: newPaid,
            balanceAmount: Math.max(0, newBal),
            status: billStatus,
            lastHandler: req.user.name,
            lastHandleTime: new Date(),
          },
        });

        await createTimelineEvent({
          billId: match.billId,
          transactionMatchId: match.id,
          eventType: 'PAYMENT_ADJUSTED',
          eventName: '流水取消匹配',
          description: `流水匹配已取消，已扣减付款 ¥${parseFloat(match.matchAmount).toLocaleString()}，匹配单号：MATCH-${match.id}`,
          operatorId: req.user.id,
          operatorName: req.user.name,
        });
      }
    }

    res.json({ message: '取消匹配成功，账单余额已恢复' });
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
