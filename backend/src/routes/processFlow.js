const express = require('express');
const prisma = require('../utils/prisma');
const { authenticate } = require('../middleware/auth');
const { logOperation } = require('../middleware/logger');

const router = express.Router();

router.use(authenticate);

router.get('/', async (req, res, next) => {
  try {
    const { planId, equipmentId, status } = req.query;
    const where = {};

    if (planId) where.planId = parseInt(planId);
    if (equipmentId) where.equipmentId = parseInt(equipmentId);
    if (status) where.status = status;

    const processFlows = await prisma.equipmentProcessFlow.findMany({
      where,
      include: {
        plan: { include: { workOrder: true } },
        equipment: true,
        process: true,
        reworks: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ code: 200, data: processFlows });
  } catch (error) {
    next(error);
  }
});

router.post('/scan',
  logOperation('SCAN', 'ProcessFlow'),
  async (req, res, next) => {
    try {
      const { qrCode, processFlowId, action, operator, outputQuantity, defectQuantity, remark } = req.body;

      if (!qrCode && !processFlowId) {
        return res.status(400).json({ code: 400, message: '请提供二维码或工序流转ID' });
      }

      let processFlow;

      if (processFlowId) {
        processFlow = await prisma.equipmentProcessFlow.findUnique({
          where: { id: parseInt(processFlowId) },
          include: { plan: true, equipment: true, process: true },
        });
      } else {
        const equipment = await prisma.equipment.findUnique({
          where: { qrCode },
          include: {
            currentPlan: {
              include: {
                processFlows: {
                  where: { status: { in: ['PENDING', 'IN_PROGRESS'] } },
                  include: { process: true },
                  orderBy: { process: { sequence: 'asc' } },
                  take: 1,
                },
              },
            },
          },
        });

        if (!equipment) {
          return res.status(404).json({ code: 404, message: '设备不存在' });
        }

        if (!equipment.currentPlan || equipment.currentPlan.processFlows.length === 0) {
          return res.status(400).json({ code: 400, message: '该设备当前没有待处理的工序' });
        }

        processFlow = equipment.currentPlan.processFlows[0];
      }

      if (!processFlow) {
        return res.status(404).json({ code: 404, message: '工序流转记录不存在' });
      }

      const updateData = {
        scannedAt: new Date(),
        scannedBy: req.user.name,
      };

      if (action === 'START') {
        if (processFlow.status !== 'PENDING') {
          return res.status(400).json({ code: 400, message: '该工序状态不允许开始' });
        }
        updateData.status = 'IN_PROGRESS';
        updateData.startTime = new Date();
        updateData.operator = operator || req.user.name;
      } else if (action === 'COMPLETE') {
        if (processFlow.status !== 'IN_PROGRESS') {
          return res.status(400).json({ code: 400, message: '该工序状态不允许完成' });
        }
        updateData.status = 'COMPLETED';
        updateData.endTime = new Date();
        updateData.outputQuantity = outputQuantity || 0;
        updateData.defectQuantity = defectQuantity || 0;
        updateData.remark = remark;
      } else {
        return res.status(400).json({ code: 400, message: '无效的操作类型' });
      }

      const updatedFlow = await prisma.equipmentProcessFlow.update({
        where: { id: processFlow.id },
        data: updateData,
        include: {
          plan: { include: { workOrder: true } },
          equipment: true,
          process: true,
        },
      });

      res.json({
        code: 200,
        message: action === 'START' ? '工序开始成功' : '工序完成成功',
        data: updatedFlow,
      });
    } catch (error) {
      next(error);
    }
  }
);

router.put('/:id',
  logOperation('UPDATE', 'ProcessFlow', (req) => ({ targetId: parseInt(req.params.id) })),
  async (req, res, next) => {
    try {
      const processFlow = await prisma.equipmentProcessFlow.update({
        where: { id: parseInt(req.params.id) },
        data: req.body,
      });
      res.json({ code: 200, message: '更新成功', data: processFlow });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
