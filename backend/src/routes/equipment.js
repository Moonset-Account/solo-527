const express = require('express');
const prisma = require('../utils/prisma');
const { authenticate, requireDirector } = require('../middleware/auth');
const { logOperation } = require('../middleware/logger');
const { equipmentSchema, validate } = require('../utils/validation');

const router = express.Router();

router.use(authenticate);

router.get('/', requireDirector, async (req, res, next) => {
  try {
    const { status, keyword } = req.query;
    const where = {};

    if (status) where.status = status;
    if (keyword) {
      where.OR = [
        { code: { contains: keyword } },
        { name: { contains: keyword } },
        { qrCode: { contains: keyword } },
      ];
    }

    const equipments = await prisma.equipment.findMany({
      where,
      include: {
        currentPlan: {
          include: {
            workOrder: true,
          },
        },
      },
      orderBy: { code: 'asc' },
    });

    res.json({ code: 200, data: equipments });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', requireDirector, async (req, res, next) => {
  try {
    const equipment = await prisma.equipment.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        processFlows: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            plan: { include: { workOrder: true } },
            process: true,
          },
        },
        utilizations: {
          take: 10,
          orderBy: { recordDate: 'desc' },
        },
      },
    });

    if (!equipment) {
      return res.status(404).json({ code: 404, message: '设备不存在' });
    }

    res.json({ code: 200, data: equipment });
  } catch (error) {
    next(error);
  }
});

router.get('/qrcode/:qrCode', async (req, res, next) => {
  try {
    const equipment = await prisma.equipment.findUnique({
      where: { qrCode: req.params.qrCode },
      include: {
        currentPlan: {
          include: {
            workOrder: true,
            processFlows: {
              include: { process: true },
              orderBy: { process: { sequence: 'asc' } },
            },
          },
        },
      },
    });

    if (!equipment) {
      return res.status(404).json({ code: 404, message: '设备不存在' });
    }

    res.json({ code: 200, data: equipment });
  } catch (error) {
    next(error);
  }
});

router.post('/', requireDirector, validate(equipmentSchema),
  logOperation('CREATE', 'Equipment'),
  async (req, res, next) => {
    try {
      const equipment = await prisma.equipment.create({
        data: req.body,
      });
      res.json({ code: 200, message: '创建设备成功', data: equipment });
    } catch (error) {
      next(error);
    }
  }
);

router.put('/:id', requireDirector,
  logOperation('UPDATE', 'Equipment', (req) => ({ targetId: parseInt(req.params.id) })),
  async (req, res, next) => {
    try {
      const equipment = await prisma.equipment.update({
        where: { id: parseInt(req.params.id) },
        data: req.body,
      });
      res.json({ code: 200, message: '更新设备成功', data: equipment });
    } catch (error) {
      next(error);
    }
  }
);

router.delete('/:id', requireDirector,
  logOperation('DELETE', 'Equipment', (req) => ({ targetId: parseInt(req.params.id) })),
  async (req, res, next) => {
    try {
      await prisma.equipment.delete({
        where: { id: parseInt(req.params.id) },
      });
      res.json({ code: 200, message: '删除设备成功' });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
