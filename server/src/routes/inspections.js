const express = require('express');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { storeId, status, inspectorId } = req.query;
    const where = {};
    if (storeId) where.storeId = parseInt(storeId);
    if (status) where.status = status;
    if (inspectorId) where.inspectorId = parseInt(inspectorId);

    const inspections = await prisma.storeInspection.findMany({
      where,
      include: {
        store: true,
        inspector: { select: { id: true, name: true } },
      },
      orderBy: { inspectionDate: 'desc' },
    });
    res.json(inspections);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const inspection = await prisma.storeInspection.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        store: true,
        inspector: true,
      },
    });
    if (!inspection) return res.status(404).json({ error: '巡店记录不存在' });
    res.json(inspection);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const inspectionNo = 'I' + Date.now();
    const inspection = await prisma.storeInspection.create({
      data: {
        ...req.body,
        inspectionNo,
        inspectionDate: new Date(req.body.inspectionDate),
        followUpDue: req.body.followUpDue ? new Date(req.body.followUpDue) : null,
      },
    });
    res.json(inspection);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const inspection = await prisma.storeInspection.update({
      where: { id: parseInt(req.params.id) },
      data: {
        ...req.body,
        inspectionDate: req.body.inspectionDate ? new Date(req.body.inspectionDate) : undefined,
        followUpDue: req.body.followUpDue ? new Date(req.body.followUpDue) : null,
      },
    });
    res.json(inspection);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await prisma.storeInspection.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ message: '删除成功' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
