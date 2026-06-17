const express = require('express');
const prisma = require('../utils/prisma');
const { authenticate, requireDirector } = require('../middleware/auth');
const { logOperation } = require('../middleware/logger');
const { notifyRework } = require('../utils/notification');
const { reworkSchema, validate } = require('../utils/validation');

const router = express.Router();

router.use(authenticate);

router.get('/', requireDirector, async (req, res, next) => {
  try {
    const { handled, processFlowId } = req.query;
    const where = {};

    if (handled !== undefined) where.handled = handled === 'true';
    if (processFlowId) where.processFlowId = parseInt(processFlowId);

    const reworks = await prisma.reworkRecord.findMany({
      where,
      include: {
        processFlow: {
          include: {
            equipment: true,
            process: true,
            plan: { include: { workOrder: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ code: 200, data: reworks });
  } catch (error) {
    next(error);
  }
});

router.post('/', requireDirector, validate(reworkSchema),
  logOperation('CREATE', 'ReworkRecord'),
  async (req, res, next) => {
    try {
      const rework = await prisma.reworkRecord.create({
        data: {
          ...req.body,
          handled: false,
        },
        include: {
          processFlow: true,
        },
      });

      await prisma.equipmentProcessFlow.update({
        where: { id: req.body.processFlowId },
        data: { status: 'REWORK' },
      });

      await notifyRework(rework, rework.processFlow);

      res.json({ code: 200, message: '返工记录创建成功', data: rework });
    } catch (error) {
      next(error);
    }
  }
);

router.post('/:id/handle', requireDirector,
  logOperation('HANDLE', 'ReworkRecord', (req) => ({ targetId: parseInt(req.params.id) })),
  async (req, res, next) => {
    try {
      const rework = await prisma.reworkRecord.update({
        where: { id: parseInt(req.params.id) },
        data: {
          handled: true,
          handledBy: req.user.name,
          handledAt: new Date(),
          remark: req.body.remark,
        },
      });

      const processFlow = await prisma.equipmentProcessFlow.update({
        where: { id: rework.processFlowId },
        data: { status: 'PENDING' },
      });

      res.json({ code: 200, message: '返工处理完成', data: { rework, processFlow } });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
