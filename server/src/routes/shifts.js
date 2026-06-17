const express = require('express');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { storeId, startDate, endDate, hasConflict, employeeId } = req.query;
    const where = {};
    if (storeId) where.storeId = parseInt(storeId);
    if (employeeId) where.employeeId = parseInt(employeeId);
    if (hasConflict !== undefined) where.hasConflict = hasConflict === 'true';
    if (startDate || endDate) {
      where.shiftDate = {};
      if (startDate) where.shiftDate.gte = new Date(startDate);
      if (endDate) where.shiftDate.lte = new Date(endDate);
    }

    const shifts = await prisma.shiftSchedule.findMany({
      where,
      include: {
        store: true,
        employee: true,
        assignedTo: { select: { id: true, name: true } },
      },
      orderBy: { shiftDate: 'desc' },
    });
    res.json(shifts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/conflicts', async (req, res) => {
  try {
    const { storeId } = req.query;
    const where = { hasConflict: true };
    if (storeId) where.storeId = parseInt(storeId);

    const shifts = await prisma.shiftSchedule.findMany({
      where,
      include: { store: true, employee: true },
      orderBy: { shiftDate: 'desc' },
    });
    res.json(shifts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/repurchase-stats', async (req, res) => {
  try {
    const { storeId, startDate, endDate } = req.query;
    const where = {};
    if (storeId) where.storeId = parseInt(storeId);
    if (startDate || endDate) {
      where.shiftDate = {};
      if (startDate) where.shiftDate.gte = new Date(startDate);
      if (endDate) where.shiftDate.lte = new Date(endDate);
    }

    const stats = await prisma.shiftSchedule.groupBy({
      by: ['employeeId'],
      where,
      _sum: { repurchaseContribution: true },
      _count: { id: true },
    });

    const employees = await prisma.employee.findMany({
      where: { id: { in: stats.map((s) => s.employeeId) } },
    });

    const result = stats.map((s) => ({
      employeeId: s.employeeId,
      employeeName: employees.find((e) => e.id === s.employeeId)?.name,
      totalContribution: s._sum.repurchaseContribution || 0,
      shiftCount: s._count.id,
    }));

    res.json(result.sort((a, b) => b.totalContribution - a.totalContribution));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { storeId, employeeId, shiftDate, startTime, endTime } = req.body;
    const date = new Date(shiftDate);

    const existingShifts = await prisma.shiftSchedule.findMany({
      where: {
        storeId,
        employeeId,
        shiftDate: {
          gte: new Date(date.setHours(0, 0, 0, 0)),
          lte: new Date(date.setHours(23, 59, 59, 999)),
        },
      },
    });

    let hasConflict = false;
    let conflictNote = null;

    for (const shift of existingShifts) {
      const [newStartH, newStartM] = startTime.split(':').map(Number);
      const [newEndH, newEndM] = endTime.split(':').map(Number);
      const [existStartH, existStartM] = shift.startTime.split(':').map(Number);
      const [existEndH, existEndM] = shift.endTime.split(':').map(Number);

      const newStart = newStartH * 60 + newStartM;
      const newEnd = newEndH * 60 + newEndM;
      const existStart = existStartH * 60 + existStartM;
      const existEnd = existEndH * 60 + existEndM;

      if (newStart < existEnd && newEnd > existStart) {
        hasConflict = true;
        conflictNote = `与 ${shift.startTime}-${shift.endTime} 的排班冲突`;
        break;
      }
    }

    const shift = await prisma.shiftSchedule.create({
      data: {
        ...req.body,
        shiftDate: new Date(shiftDate),
        hasConflict,
        conflictNote,
      },
    });
    res.json(shift);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const shift = await prisma.shiftSchedule.update({
      where: { id: parseInt(req.params.id) },
      data: req.body,
    });
    res.json(shift);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/:id/resolve', async (req, res) => {
  try {
    const shift = await prisma.shiftSchedule.update({
      where: { id: parseInt(req.params.id) },
      data: {
        hasConflict: false,
        resolution: req.body.resolution,
      },
    });
    res.json(shift);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await prisma.shiftSchedule.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ message: '删除成功' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
