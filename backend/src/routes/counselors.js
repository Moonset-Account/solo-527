const express = require('express');
const { body, validationResult } = require('express-validator');
const prisma = require('../prisma');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const { active } = req.query;
    const where = {};
    if (active !== undefined) {
      where.isActive = active === 'true';
    }
    const counselors = await prisma.counselor.findMany({
      where,
      include: {
        _count: {
          select: { appointments: true, timeSlots: true },
        },
      },
      orderBy: { id: 'asc' },
    });
    res.json({ success: true, data: counselors });
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const counselor = await prisma.counselor.findUnique({
      where: { id: parseInt(req.params.id) },
    });
    if (!counselor) {
      return res.status(404).json({ success: false, message: '咨询师不存在' });
    }
    res.json({ success: true, data: counselor });
  } catch (err) {
    next(err);
  }
});

router.post(
  '/',
  [body('name').notEmpty().withMessage('姓名必填')],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }
      const { name, title, specialty, avatar } = req.body;
      const counselor = await prisma.counselor.create({
        data: { name, title, specialty, avatar },
      });
      res.json({ success: true, data: counselor });
    } catch (err) {
      next(err);
    }
  }
);

router.put('/:id', async (req, res, next) => {
  try {
    const { name, title, specialty, avatar, isActive } = req.body;
    const counselor = await prisma.counselor.update({
      where: { id: parseInt(req.params.id) },
      data: { name, title, specialty, avatar, isActive },
    });
    res.json({ success: true, data: counselor });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    await prisma.counselor.update({
      where: { id: parseInt(req.params.id) },
      data: { isActive: false },
    });
    res.json({ success: true, message: '已停用' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
