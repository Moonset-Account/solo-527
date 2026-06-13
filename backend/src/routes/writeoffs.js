import { Router } from 'express';
import prisma from '../config/prisma.js';
import { authenticate, requireRoles } from '../middleware/auth.js';
import { generateWriteOffNo } from '../utils/generators.js';
import { createTimelineEvent } from '../utils/timeline.js';

const router = Router();

router.get('/', authenticate, requireRoles('FINANCE_STAFF', 'FINANCE_MANAGER', 'ADMIN'), async (req, res) => {
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

    const [list, total] = await Promise.all([
      prisma.writeOff.findMany({
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
      prisma.writeOff.count({ where }),
    ]);

    res.json({
      list,
      total,
      page: parseInt(page),
      pageSize: parseInt(pageSize),
    });
  } catch (error) {
    console.error('获取冲销列表失败:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
});

router.get('/:id', authenticate, requireRoles('FINANCE_STAFF', 'FINANCE_MANAGER', 'ADMIN'), async (req, res) => {
  try {
    const writeOff = await prisma.writeOff.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        customer: true,
        bill: true,
        applyBy: { select: { id: true, name: true } },
        approveBy: { select: { id: true, name: true } },
      },
    });

    if (!writeOff) {
      return res.status(404).json({ message: '冲销申请不存在' });
    }

    res.json({ writeOff });
  } catch (error) {
    console.error('获取冲销详情失败:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
});

router.post('/', authenticate, requireRoles('FINANCE_STAFF', 'FINANCE_MANAGER', 'ADMIN'), async (req, res) => {
  try {
    const { billId, customerId, writeOffAmount, reason, remark } = req.body;

    const writeOffNo = generateWriteOffNo();

    const writeOff = await prisma.writeOff.create({
      data: {
        writeOffNo,
        billId: parseInt(billId),
        customerId: parseInt(customerId),
        writeOffAmount,
        reason,
        remark,
        applyById: req.user.id,
      },
      include: {
        customer: true,
        bill: true,
      },
    });

    await createTimelineEvent({
      billId: parseInt(billId),
      writeOffId: writeOff.id,
      eventType: 'WRITEOFF_APPLIED',
      eventName: '冲销申请',
      description: `提交冲销申请 ${writeOffNo}，金额 ${writeOffAmount} 元`,
      operatorId: req.user.id,
      operatorName: req.user.name,
    });

    res.json({ writeOff });
  } catch (error) {
    console.error('创建冲销申请失败:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
});

router.put('/:id/approve', authenticate, requireRoles('FINANCE_MANAGER', 'ADMIN'), async (req, res) => {
  try {
    const writeOffId = parseInt(req.params.id);
    const { approveRemark } = req.body;

    const writeOff = await prisma.writeOff.update({
      where: { id: writeOffId },
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

    res.json({ writeOff });
  } catch (error) {
    console.error('审批冲销失败:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
});

router.put('/:id/reject', authenticate, requireRoles('FINANCE_MANAGER', 'ADMIN'), async (req, res) => {
  try {
    const writeOffId = parseInt(req.params.id);
    const { approveRemark } = req.body;

    const writeOff = await prisma.writeOff.update({
      where: { id: writeOffId },
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

    res.json({ writeOff });
  } catch (error) {
    console.error('拒绝冲销失败:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
});

router.put('/:id/process', authenticate, requireRoles('FINANCE_STAFF', 'FINANCE_MANAGER', 'ADMIN'), async (req, res) => {
  try {
    const writeOffId = parseInt(req.params.id);

    const writeOff = await prisma.writeOff.update({
      where: { id: writeOffId },
      data: {
        status: 'PROCESSED',
      },
      include: {
        bill: true,
      },
    });

    if (writeOff.billId) {
      await prisma.bill.update({
        where: { id: writeOff.billId },
        data: {
          status: 'WRITTEN_OFF',
          lastHandler: req.user.name,
          lastHandleTime: new Date(),
        },
      });

      await createTimelineEvent({
        billId: writeOff.billId,
        writeOffId,
        eventType: 'WRITEOFF_PROCESSED',
        eventName: '冲销已执行',
        description: `冲销 ${writeOff.writeOffNo} 已执行，金额 ${writeOff.writeOffAmount} 元`,
        operatorId: req.user.id,
        operatorName: req.user.name,
      });
    }

    res.json({ writeOff });
  } catch (error) {
    console.error('执行冲销失败:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
});

export default router;
