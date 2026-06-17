const express = require('express');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { isActive } = req.query;
    const where = {};
    if (isActive !== undefined) where.isActive = isActive === 'true';
    const reasons = await prisma.lossReason.findMany({
      where,
      orderBy: { id: 'asc' },
    });
    res.json(reasons);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const reason = await prisma.lossReason.create({ data: req.body });
    res.json(reason);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const reason = await prisma.lossReason.update({
      where: { id: parseInt(req.params.id) },
      data: req.body,
    });
    res.json(reason);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await prisma.lossReason.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ message: '删除成功' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
