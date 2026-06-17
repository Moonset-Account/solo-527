const express = require('express');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { category, keyword } = req.query;
    const where = {};
    if (category) where.category = category;
    if (keyword) where.name = { contains: keyword };
    const ingredients = await prisma.ingredient.findMany({
      where,
      orderBy: { id: 'desc' },
    });
    res.json(ingredients);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const ingredient = await prisma.ingredient.findUnique({
      where: { id: parseInt(req.params.id) },
    });
    if (!ingredient) return res.status(404).json({ error: '食材不存在' });
    res.json(ingredient);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const ingredient = await prisma.ingredient.create({ data: req.body });
    res.json(ingredient);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const ingredient = await prisma.ingredient.update({
      where: { id: parseInt(req.params.id) },
      data: req.body,
    });
    res.json(ingredient);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await prisma.ingredient.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ message: '删除成功' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
