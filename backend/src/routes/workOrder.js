const express = require('express');
const prisma = require('../utils/prisma');
const { authenticate, requireDirector } = require('../middleware/auth');
const { logOperation } = require('../middleware/logger');
const { notifyWorkOrder } = require('../utils/notification');
const { workOrderSchema, validate } = require('../utils/validation');

const router = express.Router();

router.use(authenticate);

router.get('/', requireDirector, async (req, res, next) => {
  try {
    const { status, keyword, startDate, endDate } = req.query;
    const where = {};

    if (status) where.status = status;
    if (keyword) {
      where.OR = [
        { orderNo: { contains: keyword } },
        { productName: { contains: keyword } },
        { productCode: { contains: keyword } },
      ];
    }
    if (startDate && endDate) {
      where.plannedDate = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const workOrders = await prisma.workOrder.findMany({
      where,
      include: {
        _count: {
          select: { plans: true, materialChecks: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ code: 200, data: workOrders });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', requireDirector, async (req, res, next) => {
  try {
    const workOrder = await prisma.workOrder.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        plans: {
          include: {
            equipment: true,
            _count: { select: { processFlows: true } },
          },
        },
        materialChecks: true,
      },
    });

    if (!workOrder) {
      return res.status(404).json({ code: 404, message: '工单不存在' });
    }

    res.json({ code: 200, data: workOrder });
  } catch (error) {
    next(error);
  }
});

router.post('/', requireDirector, validate(workOrderSchema),
  logOperation('CREATE', 'WorkOrder'),
  async (req, res, next) => {
    try {
      const workOrder = await prisma.workOrder.create({
        data: req.body,
      });
      await notifyWorkOrder(workOrder, '创建');
      res.json({ code: 200, message: '创建工单成功', data: workOrder });
    } catch (error) {
      next(error);
    }
  }
);

router.put('/:id', requireDirector,
  logOperation('UPDATE', 'WorkOrder', (req) => ({ targetId: parseInt(req.params.id) })),
  async (req, res, next) => {
    try {
      const workOrder = await prisma.workOrder.update({
        where: { id: parseInt(req.params.id) },
        data: req.body,
      });
      await notifyWorkOrder(workOrder, '更新');
      res.json({ code: 200, message: '更新工单成功', data: workOrder });
    } catch (error) {
      next(error);
    }
  }
);

router.delete('/:id', requireDirector,
  logOperation('DELETE', 'WorkOrder', (req) => ({ targetId: parseInt(req.params.id) })),
  async (req, res, next) => {
    try {
      await prisma.workOrder.delete({
        where: { id: parseInt(req.params.id) },
      });
      res.json({ code: 200, message: '删除工单成功' });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
