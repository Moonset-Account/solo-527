const express = require('express');
const prisma = require('../utils/prisma');
const { authenticate, requireDirector } = require('../middleware/auth');
const { logOperation } = require('../middleware/logger');
const { notifyPlanChange } = require('../utils/notification');
const { productionPlanSchema, validate } = require('../utils/validation');

const router = express.Router();

router.use(authenticate);

router.get('/', requireDirector, async (req, res, next) => {
  try {
    const { status, equipmentId, workOrderId, startDate, endDate } = req.query;
    const where = {};

    if (status) where.status = status;
    if (equipmentId) where.equipmentId = parseInt(equipmentId);
    if (workOrderId) where.workOrderId = parseInt(workOrderId);
    if (startDate && endDate) {
      where.plannedStart = { gte: new Date(startDate) };
      where.plannedEnd = { lte: new Date(endDate) };
    }

    const plans = await prisma.productionPlan.findMany({
      where,
      include: {
        workOrder: true,
        equipment: true,
        createdBy: { select: { name: true } },
        _count: { select: { processFlows: true } },
      },
      orderBy: [
        { priority: 'desc' },
        { plannedStart: 'asc' },
      ],
    });

    res.json({ code: 200, data: plans });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', requireDirector, async (req, res, next) => {
  try {
    const plan = await prisma.productionPlan.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        workOrder: true,
        equipment: true,
        createdBy: { select: { name: true } },
        processFlows: {
          include: { process: true },
          orderBy: { process: { sequence: 'asc' } },
        },
        utilizations: {
          orderBy: { recordDate: 'desc' },
          take: 10,
        },
      },
    });

    if (!plan) {
      return res.status(404).json({ code: 404, message: '计划不存在' });
    }

    res.json({ code: 200, data: plan });
  } catch (error) {
    next(error);
  }
});

router.post('/', requireDirector, validate(productionPlanSchema),
  logOperation('CREATE', 'ProductionPlan'),
  async (req, res, next) => {
    try {
      const { processIds, ...planData } = req.body;
      const userId = req.user.id;

      const plan = await prisma.productionPlan.create({
        data: {
          ...planData,
          createdById: userId,
          updatedById: userId,
        },
      });

      if (processIds && processIds.length > 0) {
        const processFlows = processIds.map(processId => ({
          planId: plan.id,
          equipmentId: plan.equipmentId,
          processId,
          status: 'PENDING',
        }));
        await prisma.equipmentProcessFlow.createMany({ data: processFlows });
      }

      await notifyPlanChange(plan, null, '创建');
      res.json({ code: 200, message: '创建计划成功', data: plan });
    } catch (error) {
      next(error);
    }
  }
);

router.put('/:id', requireDirector,
  logOperation('UPDATE', 'ProductionPlan', (req) => ({ targetId: parseInt(req.params.id) })),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const oldPlan = await prisma.productionPlan.findUnique({ where: { id: parseInt(id) } });

      const plan = await prisma.productionPlan.update({
        where: { id: parseInt(id) },
        data: {
          ...req.body,
          updatedById: req.user.id,
        },
      });

      if (oldPlan.status !== plan.status) {
        await notifyPlanChange(plan, oldPlan, '状态变更');
      } else {
        await notifyPlanChange(plan, oldPlan, '更新');
      }

      res.json({ code: 200, message: '更新计划成功', data: plan });
    } catch (error) {
      next(error);
    }
  }
);

router.post('/:id/confirm', requireDirector,
  logOperation('CONFIRM', 'ProductionPlan', (req) => ({ targetId: parseInt(req.params.id) })),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const oldPlan = await prisma.productionPlan.findUnique({ where: { id: parseInt(id) } });

      if (!oldPlan) {
        return res.status(404).json({ code: 404, message: '计划不存在' });
      }

      if (oldPlan.status !== 'DRAFT') {
        return res.status(400).json({ code: 400, message: '只有草稿状态的计划可以确认' });
      }

      const plan = await prisma.productionPlan.update({
        where: { id: parseInt(id) },
        data: {
          status: 'CONFIRMED',
          updatedById: req.user.id,
        },
      });

      await notifyPlanChange(plan, oldPlan, '确认');
      res.json({ code: 200, message: '计划已确认', data: plan });
    } catch (error) {
      next(error);
    }
  }
);

router.post('/:id/start', requireDirector,
  logOperation('START', 'ProductionPlan', (req) => ({ targetId: parseInt(req.params.id) })),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const oldPlan = await prisma.productionPlan.findUnique({ where: { id: parseInt(id) } });

      const plan = await prisma.productionPlan.update({
        where: { id: parseInt(id) },
        data: {
          status: 'IN_PROGRESS',
          actualStart: new Date(),
          updatedById: req.user.id,
        },
      });

      await prisma.equipment.update({
        where: { id: plan.equipmentId },
        data: {
          status: 'RUNNING',
          currentPlanId: plan.id,
        },
      });

      await notifyPlanChange(plan, oldPlan, '开始生产');
      res.json({ code: 200, message: '计划已开始', data: plan });
    } catch (error) {
      next(error);
    }
  }
);

router.post('/:id/complete', requireDirector,
  logOperation('COMPLETE', 'ProductionPlan', (req) => ({ targetId: parseInt(req.params.id) })),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const oldPlan = await prisma.productionPlan.findUnique({ where: { id: parseInt(id) } });

      const plan = await prisma.productionPlan.update({
        where: { id: parseInt(id) },
        data: {
          status: 'COMPLETED',
          actualEnd: new Date(),
          updatedById: req.user.id,
        },
      });

      await prisma.equipment.update({
        where: { id: plan.equipmentId },
        data: {
          status: 'IDLE',
          currentPlanId: null,
        },
      });

      const processFlows = await prisma.equipmentProcessFlow.findMany({
        where: { planId: parseInt(id) },
      });

      const totalOutput = processFlows.reduce((sum, f) => sum + f.outputQuantity, 0);
      const totalRunTime = processFlows.reduce((sum, f) => {
        if (f.startTime && f.endTime) {
          return sum + (f.endTime - f.startTime) / 60000;
        }
        return sum;
      }, 0);

      await prisma.equipmentUtilization.create({
        data: {
          planId: parseInt(id),
          equipmentId: plan.equipmentId,
          recordDate: new Date(),
          runTime: Math.round(totalRunTime),
          outputQuantity: totalOutput,
          utilizationRate: totalRunTime > 0 ? Math.min(100, (totalRunTime / 480) * 100) : 0,
        },
      });

      await notifyPlanChange(plan, oldPlan, '完成');
      res.json({ code: 200, message: '计划已完成', data: plan });
    } catch (error) {
      next(error);
    }
  }
);

router.delete('/:id', requireDirector,
  logOperation('DELETE', 'ProductionPlan', (req) => ({ targetId: parseInt(req.params.id) })),
  async (req, res, next) => {
    try {
      await prisma.productionPlan.delete({
        where: { id: parseInt(req.params.id) },
      });
      res.json({ code: 200, message: '删除计划成功' });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
