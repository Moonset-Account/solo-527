import { Router } from 'express';
import prisma from '../config/prisma.js';
import { authenticate, requireRoles } from '../middleware/auth.js';
import { generatePaymentNo } from '../utils/generators.js';
import { createTimelineEvent } from '../utils/timeline.js';

const router = Router();

router.get('/', authenticate, async (req, res) => {
  try {
    const { page = 1, pageSize = 10, status, customerId, billId } = req.query;
    const skip = (page - 1) * pageSize;

    const where = {};

    if (status) {
      where.status = status;
    }

    if (customerId) {
      where.customerId = parseInt(customerId);
    }

    if (billId) {
      where.billId = parseInt(billId);
    }

    if (req.user.role === 'CUSTOMER') {
      const customer = await prisma.customer.findFirst({
        where: { email: req.user.email },
      });
      if (customer) {
        where.customerId = customer.id;
      } else {
        return res.json({ list: [], total: 0, page: parseInt(page), pageSize: parseInt(pageSize) });
      }
    }

    const [list, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        skip,
        take: parseInt(pageSize),
        include: {
          customer: { select: { id: true, name: true } },
          bill: { select: { id: true, billNo: true } },
          createdBy: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.payment.count({ where }),
    ]);

    res.json({
      list,
      total,
      page: parseInt(page),
      pageSize: parseInt(pageSize),
    });
  } catch (error) {
    console.error('获取付款列表失败:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
});

router.get('/:id', authenticate, async (req, res) => {
  try {
    const payment = await prisma.payment.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        customer: true,
        bill: true,
        createdBy: { select: { id: true, name: true } },
        transactionMatch: true,
      },
    });

    if (!payment) {
      return res.status(404).json({ message: '付款记录不存在' });
    }

    res.json({ payment });
  } catch (error) {
    console.error('获取付款详情失败:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
});

router.post('/', authenticate, async (req, res) => {
  try {
    const { billId, customerId, amount, paymentMethod, paymentDate, remark } = req.body;

    let finalCustomerId = parseInt(customerId);

    if (req.user.role === 'CUSTOMER') {
      const customer = await prisma.customer.findFirst({
        where: { email: req.user.email },
      });
      if (!customer) {
        return res.status(400).json({ message: '客户信息不存在' });
      }
      finalCustomerId = customer.id;

      if (billId) {
        const bill = await prisma.bill.findUnique({
          where: { id: parseInt(billId) },
          select: { customerId: true },
        });
        if (!bill || bill.customerId !== customer.id) {
          return res.status(403).json({ message: '无权操作该账单' });
        }
      }
    }

    const paymentNo = generatePaymentNo();

    const payment = await prisma.payment.create({
      data: {
        paymentNo,
        billId: billId ? parseInt(billId) : null,
        customerId: finalCustomerId,
        amount: parseFloat(amount),
        paymentMethod,
        paymentDate: new Date(paymentDate),
        remark,
        createdById: req.user.id,
      },
      include: {
        customer: true,
        bill: true,
      },
    });

    if (billId) {
      const bill = await prisma.bill.findUnique({
        where: { id: parseInt(billId) },
        select: { totalAmount: true, paidAmount: true, balanceAmount: true },
      });

      if (bill) {
        const newPaidAmount = parseFloat(bill.paidAmount) + parseFloat(amount);
        const newBalance = parseFloat(bill.totalAmount) - newPaidAmount;
        let status = 'PARTIAL_PAID';

        if (newBalance <= 0) {
          status = 'PAID';
        } else if (newBalance < parseFloat(bill.totalAmount)) {
          status = 'PARTIAL_PAID';
        }

        await prisma.bill.update({
          where: { id: parseInt(billId) },
          data: {
            paidAmount: newPaidAmount,
            balanceAmount: Math.max(0, newBalance),
            status,
            lastHandler: req.user.name,
            lastHandleTime: new Date(),
          },
        });

        await createTimelineEvent({
          billId: parseInt(billId),
          paymentId: payment.id,
          eventType: 'PAYMENT_RECEIVED',
          eventName: '收到付款',
          description: `收到付款 ${amount} 元，付款单号：${paymentNo}`,
          operatorId: req.user.id,
          operatorName: req.user.name,
        });
      }
    }

    res.json({ payment });
  } catch (error) {
    console.error('创建付款失败:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
});

export default router;
