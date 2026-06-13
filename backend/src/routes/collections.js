import { Router } from 'express';
import prisma from '../config/prisma.js';
import { authenticate, requireRoles } from '../middleware/auth.js';
import { generateCollectionNo } from '../utils/generators.js';
import { createTimelineEvent } from '../utils/timeline.js';

const router = Router();

router.get('/', authenticate, requireRoles('FINANCE_STAFF', 'FINANCE_MANAGER', 'ADMIN'), async (req, res) => {
  try {
    const { page = 1, pageSize = 10, status, customerId, priority, assignedToId } = req.query;
    const skip = (page - 1) * pageSize;

    const where = {};

    if (status) {
      const statuses = Array.isArray(status) ? status : status.split(',');
      where.status = statuses.length > 1 ? { in: statuses } : statuses[0];
    }

    if (customerId) {
      where.customerId = parseInt(customerId);
    }

    if (priority) {
      where.priority = priority;
    }

    if (assignedToId) {
      where.assignedToId = parseInt(assignedToId);
    }

    const [list, total] = await Promise.all([
      prisma.collection.findMany({
        where,
        skip,
        take: parseInt(pageSize),
        include: {
          customer: { select: { id: true, name: true, customerNo: true } },
          bill: { select: { id: true, billNo: true, totalAmount: true, dueDate: true } },
          assignedTo: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.collection.count({ where }),
    ]);

    res.json({
      list,
      total,
      page: parseInt(page),
      pageSize: parseInt(pageSize),
    });
  } catch (error) {
    console.error('获取催收列表失败:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
});

router.get('/:id', authenticate, async (req, res) => {
  try {
    const collection = await prisma.collection.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        customer: true,
        bill: true,
        assignedTo: { select: { id: true, name: true } },
        records: {
          include: {
            operator: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!collection) {
      return res.status(404).json({ message: '催收记录不存在' });
    }

    res.json({ collection });
  } catch (error) {
    console.error('获取催收详情失败:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
});

router.post('/', authenticate, requireRoles('FINANCE_STAFF', 'FINANCE_MANAGER', 'ADMIN'), async (req, res) => {
  try {
    const { billId, customerId, priority, dueDate, amount, assignedToId, remark } = req.body;

    const collectionNo = generateCollectionNo();

    const collection = await prisma.collection.create({
      data: {
        collectionNo,
        billId: parseInt(billId),
        customerId: parseInt(customerId),
        priority: priority || 'NORMAL',
        dueDate: new Date(dueDate),
        amount,
        assignedToId: assignedToId ? parseInt(assignedToId) : null,
        remark,
      },
      include: {
        customer: true,
        bill: true,
      },
    });

    await createTimelineEvent({
      billId: parseInt(billId),
      collectionId: collection.id,
      eventType: 'COLLECTION_CREATED',
      eventName: '创建催收',
      description: `创建催收单 ${collectionNo}`,
      operatorId: req.user.id,
      operatorName: req.user.name,
    });

    res.json({ collection });
  } catch (error) {
    console.error('创建催收失败:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
});

router.post('/:id/record', authenticate, requireRoles('FINANCE_STAFF', 'FINANCE_MANAGER', 'ADMIN'), async (req, res) => {
  try {
    const collectionId = parseInt(req.params.id);
    const { stage, action, result, contactTime, remark } = req.body;

    const record = await prisma.collectionRecord.create({
      data: {
        collectionId,
        stage: parseInt(stage),
        action,
        result,
        contactTime: contactTime ? new Date(contactTime) : new Date(),
        operatorId: req.user.id,
        remark,
      },
      include: {
        operator: { select: { id: true, name: true } },
      },
    });

    await prisma.collection.update({
      where: { id: collectionId },
      data: {
        currentStage: parseInt(stage),
        status: 'IN_PROGRESS',
      },
    });

    const collection = await prisma.collection.findUnique({
      where: { id: collectionId },
      select: { billId: true, collectionNo: true },
    });

    if (collection?.billId) {
      await createTimelineEvent({
        billId: collection.billId,
        collectionId,
        eventType: 'COLLECTION_RECORD',
        eventName: '催收记录',
        description: `阶段${stage}：${action} - ${result || ''}`,
        operatorId: req.user.id,
        operatorName: req.user.name,
      });
    }

    res.json({ record });
  } catch (error) {
    console.error('添加催收记录失败:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
});

router.put('/:id/status', authenticate, requireRoles('FINANCE_STAFF', 'FINANCE_MANAGER', 'ADMIN'), async (req, res) => {
  try {
    const { status, remark } = req.body;
    const collectionId = parseInt(req.params.id);

    const collection = await prisma.collection.update({
      where: { id: collectionId },
      data: {
        status,
        remark: remark !== undefined ? remark : undefined,
      },
    });

    res.json({ collection });
  } catch (error) {
    console.error('更新催收状态失败:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
});

export default router;
