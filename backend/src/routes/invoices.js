import { Router } from 'express';
import prisma from '../config/prisma.js';
import { authenticate, requireRoles } from '../middleware/auth.js';
import { generateInvoiceNo } from '../utils/generators.js';
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
      prisma.invoice.findMany({
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
      prisma.invoice.count({ where }),
    ]);

    res.json({
      list,
      total,
      page: parseInt(page),
      pageSize: parseInt(pageSize),
    });
  } catch (error) {
    console.error('获取发票列表失败:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
});

router.get('/:id', authenticate, async (req, res) => {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        customer: true,
        bill: true,
        createdBy: { select: { id: true, name: true } },
      },
    });

    if (!invoice) {
      return res.status(404).json({ message: '发票不存在' });
    }

    res.json({ invoice });
  } catch (error) {
    console.error('获取发票详情失败:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
});

router.post('/', authenticate, requireRoles('FINANCE_STAFF', 'FINANCE_MANAGER', 'ADMIN'), async (req, res) => {
  try {
    const { billId, customerId, invoiceType, invoiceAmount, taxAmount, remark } = req.body;

    const invoiceNo = generateInvoiceNo();

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNo,
        billId: billId ? parseInt(billId) : null,
        customerId: parseInt(customerId),
        invoiceType,
        invoiceAmount,
        taxAmount: taxAmount || 0,
        remark,
        createdById: req.user.id,
      },
      include: {
        customer: true,
        bill: true,
      },
    });

    res.json({ invoice });
  } catch (error) {
    console.error('创建发票失败:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
});

router.put('/:id/issue', authenticate, requireRoles('FINANCE_STAFF', 'FINANCE_MANAGER', 'ADMIN'), async (req, res) => {
  try {
    const invoiceId = parseInt(req.params.id);

    const invoice = await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        status: 'ISSUED',
        issueDate: new Date(),
      },
    });

    res.json({ invoice });
  } catch (error) {
    console.error('开具发票失败:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
});

router.put('/:id/void', authenticate, requireRoles('FINANCE_MANAGER', 'ADMIN'), async (req, res) => {
  try {
    const invoiceId = parseInt(req.params.id);
    const { reason } = req.body;

    const invoice = await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        status: 'VOIDED',
        remark: reason,
      },
    });

    res.json({ invoice });
  } catch (error) {
    console.error('作废发票失败:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
});

export default router;
