import { Router } from 'express';
import prisma from '../config/prisma.js';
import { authenticate, requireRoles } from '../middleware/auth.js';
import { generateBillNo } from '../utils/generators.js';
import { createTimelineEvent } from '../utils/timeline.js';

const router = Router();

router.get('/', authenticate, async (req, res) => {
  try {
    const { page = 1, pageSize = 10, status, customerId, billPeriod, keyword } = req.query;
    const skip = (page - 1) * pageSize;

    const where = {};

    if (status) {
      const statuses = Array.isArray(status) ? status : status.split(',');
      where.status = statuses.length > 1 ? { in: statuses } : statuses[0];
    }

    if (customerId) {
      where.customerId = parseInt(customerId);
    }

    if (billPeriod) {
      where.billPeriod = billPeriod;
    }

    if (keyword) {
      where.OR = [
        { billNo: { contains: keyword } },
        { customer: { name: { contains: keyword } } },
      ];
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
      prisma.bill.findMany({
        where,
        skip,
        take: parseInt(pageSize),
        include: {
          customer: { select: { id: true, name: true, customerNo: true } },
          createdBy: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.bill.count({ where }),
    ]);

    res.json({
      list,
      total,
      page: parseInt(page),
      pageSize: parseInt(pageSize),
    });
  } catch (error) {
    console.error('获取账单列表失败:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
});

router.get('/:id', authenticate, async (req, res) => {
  try {
    const bill = await prisma.bill.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        customer: true,
        billItems: true,
        invoices: true,
        payments: true,
        createdBy: { select: { id: true, name: true } },
      },
    });

    if (!bill) {
      return res.status(404).json({ message: '账单不存在' });
    }

    if (req.user.role === 'CUSTOMER') {
      const customer = await prisma.customer.findFirst({
        where: { email: req.user.email },
      });
      if (!customer || customer.id !== bill.customerId) {
        return res.status(403).json({ message: '无权限查看该账单' });
      }
    }

    res.json({ bill });
  } catch (error) {
    console.error('获取账单详情失败:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
});

router.post('/', authenticate, requireRoles('FINANCE_STAFF', 'FINANCE_MANAGER', 'ADMIN'), async (req, res) => {
  try {
    const { customerId, billPeriod, billDate, dueDate, totalAmount, remark, billItems } = req.body;

    const billNo = generateBillNo();

    const bill = await prisma.bill.create({
      data: {
        billNo,
        customerId: parseInt(customerId),
        billPeriod,
        billDate: new Date(billDate),
        dueDate: new Date(dueDate),
        totalAmount,
        balanceAmount: totalAmount,
        remark,
        createdById: req.user.id,
        lastHandler: req.user.name,
        lastHandleTime: new Date(),
        billItems: {
          create: billItems?.map(item => ({
            productName: item.productName,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            amount: item.amount,
            remark: item.remark,
          })) || [],
        },
      },
      include: {
        customer: true,
        billItems: true,
      },
    });

    await createTimelineEvent({
      billId: bill.id,
      eventType: 'BILL_CREATED',
      eventName: '账单创建',
      description: `创建账单 ${billNo}`,
      operatorId: req.user.id,
      operatorName: req.user.name,
    });

    res.json({ bill });
  } catch (error) {
    console.error('创建账单失败:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
});

router.put('/:id', authenticate, requireRoles('FINANCE_STAFF', 'FINANCE_MANAGER', 'ADMIN'), async (req, res) => {
  try {
    const { status, remark } = req.body;
    const billId = parseInt(req.params.id);

    const bill = await prisma.bill.update({
      where: { id: billId },
      data: {
        status: status || undefined,
        remark: remark !== undefined ? remark : undefined,
        lastHandler: req.user.name,
        lastHandleTime: new Date(),
      },
      include: {
        customer: true,
        billItems: true,
      },
    });

    if (status) {
      await createTimelineEvent({
        billId,
        eventType: 'BILL_STATUS_CHANGED',
        eventName: '状态变更',
        description: `状态变更为 ${status}`,
        operatorId: req.user.id,
        operatorName: req.user.name,
      });
    }

    res.json({ bill });
  } catch (error) {
    console.error('更新账单失败:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
});

router.get('/options/list', authenticate, async (req, res) => {
  try {
    const { keyword, customerId, status } = req.query;
    const where = {};

    if (keyword) {
      where.OR = [
        { billNo: { contains: keyword } },
        { billPeriod: { contains: keyword } },
      ];
    }

    if (customerId) {
      where.customerId = parseInt(customerId);
    }

    if (status) {
      where.status = status;
    }

    const bills = await prisma.bill.findMany({
      where,
      select: {
        id: true,
        billNo: true,
        billPeriod: true,
        totalAmount: true,
        balanceAmount: true,
        status: true,
        customer: {
          select: { id: true, name: true },
        },
      },
      take: 50,
      orderBy: { billDate: 'desc' },
    });

    res.json({ list: bills });
  } catch (error) {
    console.error('获取账单选项失败:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
});

router.get('/:id/timeline', authenticate, async (req, res) => {
  try {
    const billId = parseInt(req.params.id);

    const timeline = await prisma.timeline.findMany({
      where: { billId },
      orderBy: { eventTime: 'desc' },
    });

    res.json({ timeline });
  } catch (error) {
    console.error('获取时间轴失败:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
});

export default router;
