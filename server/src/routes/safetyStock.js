const express = require('express');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { storeId } = req.query;
    const where = storeId ? { storeId: parseInt(storeId) } : {};
    const safetyStocks = await prisma.safetyStock.findMany({
      where,
      include: { ingredient: true, store: true },
    });
    res.json(safetyStocks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { storeId, ingredientId, minQuantity, maxQuantity } = req.body;
    const existing = await prisma.safetyStock.findUnique({
      where: { storeId_ingredientId: { storeId, ingredientId } },
    });
    if (existing) {
      const safetyStock = await prisma.safetyStock.update({
        where: { storeId_ingredientId: { storeId, ingredientId } },
        data: { minQuantity, maxQuantity },
      });
      res.json(safetyStock);
    } else {
      const safetyStock = await prisma.safetyStock.create({ data: req.body });
      res.json(safetyStock);
    }
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await prisma.safetyStock.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ message: '删除成功' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
