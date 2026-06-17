const express = require('express');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const stores = await prisma.store.findMany({
      include: { supervisor: { select: { id: true, name: true } } },
      orderBy: { id: 'desc' },
    });
    res.json(stores);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const store = await prisma.store.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { supervisor: true, employees: true },
    });
    if (!store) return res.status(404).json({ error: '门店不存在' });
    res.json(store);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const store = await prisma.store.create({ data: req.body });
    res.json(store);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const store = await prisma.store.update({
      where: { id: parseInt(req.params.id) },
      data: req.body,
    });
    res.json(store);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await prisma.store.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ message: '删除成功' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
