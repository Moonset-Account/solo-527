const express = require('express');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { storeId, status, startDate, endDate } = req.query;
    const where = {};
    if (storeId) where.storeId = parseInt(storeId);
    if (status) where.status = status;
    if (startDate || endDate) {
      where.bakingTime = {};
      if (startDate) where.bakingTime.gte = new Date(startDate);
      if (endDate) where.bakingTime.lte = new Date(endDate);
    }
    const batches = await prisma.bakingBatch.findMany({
      where,
      include: {
        store: true,
        ingredients: { include: { ingredient: true } },
        lossReports: true,
      },
      orderBy: { bakingTime: 'desc' },
    });
    res.json(batches);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const batch = await prisma.bakingBatch.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        store: true,
        ingredients: { include: { ingredient: true } },
        lossReports: { include: { lossReason: true, ingredients: { include: { ingredient: true } } } },
      },
    });
    if (!batch) return res.status(404).json({ error: '批次不存在' });
    res.json(batch);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { ingredients, ...batchData } = req.body;
    const batchNo = 'B' + Date.now();
    const batch = await prisma.bakingBatch.create({
      data: {
        ...batchData,
        batchNo,
        bakingTime: new Date(batchData.bakingTime),
        ingredients: ingredients
          ? {
              create: ingredients.map((ing) => ({
                ingredientId: ing.ingredientId,
                quantity: ing.quantity,
                unit: ing.unit,
              })),
            }
          : undefined,
      },
      include: { ingredients: true },
    });

    if (ingredients) {
      for (const ing of ingredients) {
        const existing = await prisma.inventory.findUnique({
          where: {
            storeId_ingredientId: {
              storeId: batchData.storeId,
              ingredientId: ing.ingredientId,
            },
          },
        });
        if (existing) {
          await prisma.inventory.update({
            where: {
              storeId_ingredientId: {
                storeId: batchData.storeId,
                ingredientId: ing.ingredientId,
              },
            },
            data: { quantity: existing.quantity - ing.quantity, lastUpdated: new Date() },
          });
        }
      }
    }

    res.json(batch);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const batch = await prisma.bakingBatch.update({
      where: { id: parseInt(req.params.id) },
      data: req.body,
    });
    res.json(batch);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
