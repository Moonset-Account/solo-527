const express = require('express');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { storeId, approvalStatus, lossReasonId, startDate, endDate, ingredientId } = req.query;
    const where = {};
    if (storeId) where.storeId = parseInt(storeId);
    if (approvalStatus) where.approvalStatus = approvalStatus;
    if (lossReasonId) where.lossReasonId = parseInt(lossReasonId);
    if (startDate || endDate) {
      where.reportTime = {};
      if (startDate) where.reportTime.gte = new Date(startDate);
      if (endDate) where.reportTime.lte = new Date(endDate);
    }
    if (ingredientId) {
      where.ingredients = { some: { ingredientId: parseInt(ingredientId) } };
    }

    const reports = await prisma.lossReport.findMany({
      where,
      include: {
        store: true,
        batch: true,
        lossReason: true,
        ingredients: { include: { ingredient: true } },
        approval: { include: { approver: { select: { id: true, name: true } } } },
      },
      orderBy: { reportTime: 'desc' },
    });
    res.json(reports);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const report = await prisma.lossReport.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        store: true,
        batch: true,
        lossReason: true,
        ingredients: { include: { ingredient: true } },
        approval: { include: { approver: true } },
      },
    });
    if (!report) return res.status(404).json({ error: '报损记录不存在' });
    res.json(report);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { ingredients, ...reportData } = req.body;
    const reportNo = 'L' + Date.now();
    const report = await prisma.lossReport.create({
      data: {
        ...reportData,
        reportNo,
        reportTime: new Date(reportData.reportTime),
        ingredients: ingredients
          ? {
              create: ingredients.map((ing) => ({
                ingredientId: ing.ingredientId,
                quantity: ing.quantity,
                unit: ing.unit,
                unitPrice: ing.unitPrice,
                totalValue: ing.quantity * ing.unitPrice,
              })),
            }
          : undefined,
      },
      include: { ingredients: true },
    });

    if (ingredients && ingredients.length > 0 && reportData.batchId) {
      const totalValue = ingredients.reduce((sum, ing) => sum + ing.quantity * ing.unitPrice, 0);
      await prisma.lossReport.update({
        where: { id: report.id },
        data: { lossValue: totalValue },
      });
    }

    res.json(report);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { ingredients, ...updateData } = req.body;
    const report = await prisma.lossReport.update({
      where: { id: parseInt(req.params.id) },
      data: updateData,
    });

    if (ingredients) {
      await prisma.lossIngredient.deleteMany({ where: { lossReportId: parseInt(req.params.id) } });
      await prisma.lossIngredient.createMany({
        data: ingredients.map((ing) => ({
          lossReportId: parseInt(req.params.id),
          ingredientId: ing.ingredientId,
          quantity: ing.quantity,
          unit: ing.unit,
          unitPrice: ing.unitPrice,
          totalValue: ing.quantity * ing.unitPrice,
        })),
      });
    }

    res.json(report);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message });
  }
});

router.put('/:id/follow-up', async (req, res) => {
  try {
    const report = await prisma.lossReport.update({
      where: { id: parseInt(req.params.id) },
      data: { followUpAction: req.body.followUpAction },
    });
    res.json(report);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
