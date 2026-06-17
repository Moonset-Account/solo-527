const express = require('express');
const prisma = require('../utils/prisma');
const { authenticate, requireDirector } = require('../middleware/auth');
const { logOperation } = require('../middleware/logger');
const { processSchema, validate } = require('../utils/validation');

const router = express.Router();

router.use(authenticate);

router.get('/', requireDirector, async (req, res, next) => {
  try {
    const processes = await prisma.process.findMany({
      orderBy: { sequence: 'asc' },
    });
    res.json({ code: 200, data: processes });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', requireDirector, async (req, res, next) => {
  try {
    const process = await prisma.process.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        processFlows: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: { equipment: true, plan: { include: { workOrder: true } } },
        },
      },
    });

    if (!process) {
      return res.status(404).json({ code: 404, message: '工序不存在' });
    }

    res.json({ code: 200, data: process });
  } catch (error) {
    next(error);
  }
});

router.post('/', requireDirector, validate(processSchema),
  logOperation('CREATE', 'Process'),
  async (req, res, next) => {
    try {
      const process = await prisma.process.create({
        data: req.body,
      });
      res.json({ code: 200, message: '创建工序成功', data: process });
    } catch (error) {
      next(error);
    }
  }
);

router.put('/:id', requireDirector,
  logOperation('UPDATE', 'Process', (req) => ({ targetId: parseInt(req.params.id) })),
  async (req, res, next) => {
    try {
      const process = await prisma.process.update({
        where: { id: parseInt(req.params.id) },
        data: req.body,
      });
      res.json({ code: 200, message: '更新工序成功', data: process });
    } catch (error) {
      next(error);
    }
  }
);

router.delete('/:id', requireDirector,
  logOperation('DELETE', 'Process', (req) => ({ targetId: parseInt(req.params.id) })),
  async (req, res, next) => {
    try {
      await prisma.process.delete({
        where: { id: parseInt(req.params.id) },
      });
      res.json({ code: 200, message: '删除工序成功' });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
