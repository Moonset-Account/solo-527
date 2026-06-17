const express = require('express');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { storeId, lowStock } = req.query;
    const where = {};
    if (storeId) where.storeId = parseInt(storeId);

    let inventories = await prisma.inventory.findMany({
      where,
      include: { ingredient: true, store: true },
      orderBy: { id: 'desc' },
    });

    if (lowStock === 'true') {
      const safetyStocks = await prisma.safetyStock.findMany();
      inventories = inventories.filter((inv) => {
        const ss = safetyStocks.find(
          (s) => s.storeId === inv.storeId && s.ingredientId === inv.ingredientId
        );
        return ss && inv.quantity < ss.minQuantity;
      });
    }

    res.json(inventories);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { storeId, ingredientId, quantity, unit } = req.body;
    const existing = await prisma.inventory.findUnique({
      where: { storeId_ingredientId: { storeId, ingredientId } },
    });
    if (existing) {
      const inventory = await prisma.inventory.update({
        where: { storeId_ingredientId: { storeId, ingredientId } },
        data: { quantity, unit, lastUpdated: new Date() },
      });
      res.json(inventory);
    } else {
      const inventory = await prisma.inventory.create({ data: req.body });
      res.json(inventory);
    }
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const inventory = await prisma.inventory.update({
      where: { id: parseInt(req.params.id) },
      data: { ...req.body, lastUpdated: new Date() },
    });
    res.json(inventory);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
