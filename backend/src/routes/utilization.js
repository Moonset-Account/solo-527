const express = require('express');
const prisma = require('../utils/prisma');
const { authenticate, requireDirector } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

router.get('/', requireDirector, async (req, res, next) => {
  try {
    const { equipmentId, planId, startDate, endDate } = req.query;
    const where = {};

    if (equipmentId) where.equipmentId = parseInt(equipmentId);
    if (planId) where.planId = parseInt(planId);
    if (startDate && endDate) {
      where.recordDate = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const utilizations = await prisma.equipmentUtilization.findMany({
      where,
      include: {
        equipment: true,
        plan: { include: { workOrder: true } },
      },
      orderBy: { recordDate: 'desc' },
    });

    const stats = await prisma.equipmentUtilization.aggregate({
      where,
      _sum: {
        runTime: true,
        stopTime: true,
        idleTime: true,
        outputQuantity: true,
      },
      _avg: {
        utilizationRate: true,
      },
    });

    res.json({
      code: 200,
      data: utilizations,
      stats: {
        totalRunTime: stats._sum.runTime || 0,
        totalStopTime: stats._sum.stopTime || 0,
        totalIdleTime: stats._sum.idleTime || 0,
        totalOutput: stats._sum.outputQuantity || 0,
        avgUtilizationRate: Math.round(stats._avg.utilizationRate || 0),
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get('/summary', requireDirector, async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const where = {};
    if (startDate && endDate) {
      where.recordDate = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const equipments = await prisma.equipment.findMany({
      include: {
        utilizations: {
          where,
          orderBy: { recordDate: 'asc' },
        },
      },
      orderBy: { code: 'asc' },
    });

    const summary = equipments.map(eq => {
      const totalRunTime = eq.utilizations.reduce((sum, u) => sum + u.runTime, 0);
      const totalRecords = eq.utilizations.length;
      const avgUtilization = totalRecords > 0
        ? eq.utilizations.reduce((sum, u) => sum + u.utilizationRate, 0) / totalRecords
        : 0;

      return {
        equipment: eq,
        totalRunTime,
        totalOutput: eq.utilizations.reduce((sum, u) => sum + u.outputQuantity, 0),
        avgUtilizationRate: Math.round(avgUtilization),
        records: eq.utilizations,
      };
    });

    res.json({ code: 200, data: summary });
  } catch (error) {
    next(error);
  }
});

router.post('/', requireDirector, async (req, res, next) => {
  try {
    const utilization = await prisma.equipmentUtilization.create({
      data: req.body,
    });
    res.json({ code: 200, message: '创建成功', data: utilization });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
