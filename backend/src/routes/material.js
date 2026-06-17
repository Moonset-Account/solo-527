const express = require('express');
const prisma = require('../utils/prisma');
const { authenticate, requireDirector } = require('../middleware/auth');
const { logOperation } = require('../middleware/logger');
const { notifyMaterial } = require('../utils/notification');
const { materialCheckSchema, validate } = require('../utils/validation');

const router = express.Router();

router.use(authenticate);

router.get('/', requireDirector, async (req, res, next) => {
  try {
    const { workOrderId, isComplete } = req.query;
    const where = {};

    if (workOrderId) where.workOrderId = parseInt(workOrderId);
    if (isComplete !== undefined) where.isComplete = isComplete === 'true';

    const checks = await prisma.materialCheck.findMany({
      where,
      include: {
        workOrder: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ code: 200, data: checks });
  } catch (error) {
    next(error);
  }
});

router.post('/', requireDirector, validate(materialCheckSchema),
  logOperation('CREATE', 'MaterialCheck'),
  async (req, res, next) => {
    try {
      const data = {
        ...req.body,
        isComplete: req.body.availableQty >= req.body.requiredQty,
        checkedBy: req.user.name,
        checkedAt: new Date(),
      };

      const check = await prisma.materialCheck.create({
        data,
        include: { workOrder: true },
      });

      if (!check.isComplete) {
        const workOrder = await prisma.workOrder.update({
          where: { id: check.workOrderId },
          data: { materialReady: false },
        });
        check.workOrder = workOrder;
      }

      await notifyMaterial(check, check.workOrder);

      res.json({ code: 200, message: '物料检查创建成功', data: check });
    } catch (error) {
      next(error);
    }
  }
);

router.put('/:id', requireDirector,
  logOperation('UPDATE', 'MaterialCheck', (req) => ({ targetId: parseInt(req.params.id) })),
  async (req, res, next) => {
    try {
      const oldCheck = await prisma.materialCheck.findUnique({
        where: { id: parseInt(req.params.id) },
        include: { workOrder: true },
      });

      const data = {
        ...req.body,
        isComplete: req.body.availableQty >= req.body.requiredQty,
        checkedBy: req.user.name,
        checkedAt: new Date(),
      };

      const check = await prisma.materialCheck.update({
        where: { id: parseInt(req.params.id) },
        data,
        include: { workOrder: true },
      });

      if (oldCheck.isComplete !== check.isComplete) {
        await notifyMaterial(check, check.workOrder);
      }

      res.json({ code: 200, message: '更新成功', data: check });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
