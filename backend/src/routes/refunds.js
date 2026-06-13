import { Router } from 'express';
import prisma from '../config/prisma.js';
import { authenticate, requireRoles } from '../middleware/auth.js';
import { generateRefundNo } from '../utils/generators.js';
import { createTimelineEvent } from '../utils/timeline.js';

const router = Router();

router.get('/', authenticate, async (req, res) => {
  try {
    const { page = 1, pageSize = 10, status, customerId, billId } = req.query;
    const skip = (page - 1) * pageSize;

    const where = {};

    if (status) {
      const statuses = Array.isArray(status) ? status : status.split(',');
      where.status = statuses.length > 1 ? { in: statuses } : statuses[0];
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
      prisma.refund.findMany({
        where,
        skip,
        take: parseInt(pageSize),
        include: {
          customer: { select: { id: true, name: true } },
          bill: { select: { id: true, billNo: true } },
          applyBy: { select: { id: true, name: true } },
          approveBy: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.refund.count({ where }),
    ]);

    res.json({
      list,
      total,
      page: parseInt(page),
      pageSize: parseInt(pageSize),
    });
  } catch (error) {
    console.error('获取退款列表失败:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
});

router.get('/:id', authenticate, async (req, res) => {
  try {
    const refund = await prisma.refund.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        customer: true,
        bill: true,
        applyBy: { select: { id: true, name: true } },
        approveBy: { select: { id: true, name: true } },
      },
    });

    if (!refund) {
      return res.status(404).json({ message: '退款申请不存在' });
    }

    res.json({ refund });
  } catch (error) {
    console.error('获取退款详情失败:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
});

router.post('/', authenticate, requireRoles('FINANCE_STAFF', 'FINANCE_MANAGER', 'ADMIN'), async (req, res) => {
  try {
    const { billId, customerId, refundAmount, refundReason, refundType, remark } = req.body;

    const refundNo = generateRefundNo();

    const refund = await prisma.refund.create({
      data: {
        refundNo,
        billId: billId ? parseInt(billId) : null,
        customerId: parseInt(customerId),
        refundAmount,
        refundReason,
        refundType,
        remark,
        applyById: req.user.id,
      },
      include: {
        customer: true,
        bill: true,
      },
    });

    if (billId) {
      await createTimelineEvent({
        billId: parseInt(billId),
        refundId: refund.id,
        eventType: 'REFUND_APPLIED',
        eventName: '退款申请',
        description: `提交退款申请 ${refundNo}，金额 ¥${parseFloat(refundAmount).toLocaleString()}，原因：${refundReason}`,
        operatorId: req.user.id,
        operatorName: req.user.name,
      });

      await prisma.bill.update({
        where: { id: parseInt(billId) },
        data: {
          lastHandler: req.user.name,
          lastHandleTime: new Date(),
        },
      });
    }

    res.json({ refund });
  } catch (error) {
    console.error('创建退款申请失败:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
});

router.put('/:id/approve', authenticate, requireRoles('FINANCE_MANAGER', 'ADMIN'), async (req, res) => {
  try {
    const refundId = parseInt(req.params.id);
    const { approveRemark } = req.body;

    const refund = await prisma.refund.update({
      where: { id: refundId },
      data: {
        status: 'APPROVED',
        approveById: req.user.id,
        approveTime: new Date(),
        approveRemark,
      },
      include: {
        bill: true,
      },
    });

    if (refund.billId) {
      await createTimelineEvent({
        billId: refund.billId,
        refundId,
        eventType: 'REFUND_APPROVED',
        eventName: '退款审批通过',
        description: `退款申请 ${refund.refundNo} 金额 ¥${parseFloat(refund.refundAmount).toLocaleString()} 已通过审批${approveRemark ? `，意见：${approveRemark}` : ''}`,
        operatorId: req.user.id,
        operatorName: req.user.name,
      });

      await prisma.bill.update({
        where: { id: refund.billId },
        data: {
          lastHandler: req.user.name,
          lastHandleTime: new Date(),
        },
      });
    }

    res.json({ refund });
  } catch (error) {
    console.error('审批退款失败:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
});

router.put('/:id/reject', authenticate, requireRoles('FINANCE_MANAGER', 'ADMIN'), async (req, res) => {
  try {
    const refundId = parseInt(req.params.id);
    const { approveRemark } = req.body;

    const refund = await prisma.refund.update({
      where: { id: refundId },
      data: {
        status: 'REJECTED',
        approveById: req.user.id,
        approveTime: new Date(),
        approveRemark,
      },
      include: {
        bill: true,
      },
    });

    if (refund.billId) {
      await createTimelineEvent({
        billId: refund.billId,
        refundId,
        eventType: 'REFUND_REJECTED',
        eventName: '退款申请被拒',
        description: `退款申请 ${refund.refundNo} 金额 ¥${parseFloat(refund.refundAmount).toLocaleString()} 被拒绝${approveRemark ? `，原因：${approveRemark}` : ''}`,
        operatorId: req.user.id,
        operatorName: req.user.name,
      });

      await prisma.bill.update({
        where: { id: refund.billId },
        data: {
          lastHandler: req.user.name,
          lastHandleTime: new Date(),
        },
      });
    }

    res.json({ refund });
  } catch (error) {
    console.error('拒绝退款失败:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
});

router.put('/:id/process', authenticate, requireRoles('FINANCE_STAFF', 'FINANCE_MANAGER', 'ADMIN'), async (req, res) => {
  try {
    const refundId = parseInt(req.params.id);

    const refund = await prisma.refund.update({
      where: { id: refundId },
      data: {
        status: 'PROCESSED',
        processTime: new Date(),
      },
      include: {
        bill: true,
      },
    });

    if (refund.billId) {
      const bill = await prisma.bill.findUnique({
        where: { id: refund.billId },
        select: { totalAmount: true, paidAmount: true, balanceAmount: true },
      });

      if (bill) {
        const newPaidAmount = Math.max(0, parseFloat(bill.paidAmount) - parseFloat(refund.refundAmount));
        const newBalance = parseFloat(bill.totalAmount) - newPaidAmount;

        await prisma.bill.update({
          where: { id: refund.billId },
          data: {
            paidAmount: newPaidAmount,
            balanceAmount: newBalance,
            status: newBalance <= 0 ? 'PAID' : 'PARTIAL_PAID',
            lastHandler: req.user.name,
            lastHandleTime: new Date(),
          },
        });
      }

      await createTimelineEvent({
        billId: refund.billId,
        refundId,
        eventType: 'REFUND_PROCESSED',
        eventName: '退款已处理',
        description: `退款 ${refund.refundNo} 已完成，退款 ¥${parseFloat(refund.refundAmount).toLocaleString()}，账单余额已同步调整`,
        operatorId: req.user.id,
        operatorName: req.user.name,
      });
    }

    res.json({ refund });
  } catch (error) {
    console.error('处理退款失败:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
});

export default router;
