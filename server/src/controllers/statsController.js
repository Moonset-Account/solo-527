const prisma = require('../utils/prisma');
const { success } = require('../utils/response');

async function getDashboardStats(req, res, next) {
  try {
    const [
      totalEvents,
      pendingEvents,
      processingEvents,
      completedEvents,
      totalFacilities,
      damagedFacilities,
      totalGridWorkers,
      totalDepartments,
    ] = await Promise.all([
      prisma.event.count(),
      prisma.event.count({ where: { status: 'PENDING' } }),
      prisma.event.count({ where: { status: 'PROCESSING' } }),
      prisma.event.count({ where: { status: 'COMPLETED' } }),
      prisma.facility.count(),
      prisma.facility.count({ where: { status: 'DAMAGED' } }),
      prisma.user.count({ where: { role: 'GRID_WORKER' } }),
      prisma.department.count(),
    ]);

    return success(res, {
      totalEvents,
      pendingEvents,
      processingEvents,
      completedEvents,
      totalFacilities,
      damagedFacilities,
      totalGridWorkers,
      totalDepartments,
    });
  } catch (err) {
    next(err);
  }
}

async function getEventTrendStats(req, res, next) {
  try {
    const days = parseInt(req.query.days) || 30;

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days + 1);
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    const events = await prisma.event.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        id: true,
        createdAt: true,
        completedAt: true,
      },
    });

    const dateMap = {};
    for (let i = 0; i < days; i++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      dateMap[dateStr] = {
        date: dateStr,
        count: 0,
        completed: 0,
      };
    }

    events.forEach(event => {
      const createDate = event.createdAt.toISOString().split('T')[0];
      if (dateMap[createDate]) {
        dateMap[createDate].count++;
      }
      if (event.completedAt) {
        const completeDate = event.completedAt.toISOString().split('T')[0];
        if (dateMap[completeDate]) {
          dateMap[completeDate].completed++;
        }
      }
    });

    const trend = Object.values(dateMap).sort((a, b) => a.date.localeCompare(b.date));

    return success(res, trend);
  } catch (err) {
    next(err);
  }
}

async function getEventTypeStats(req, res, next) {
  try {
    const typeStats = await prisma.event.groupBy({
      by: ['type'],
      _count: true,
    });

    const result = typeStats.map(item => ({
      type: item.type,
      count: item._count,
    }));

    return success(res, result);
  } catch (err) {
    next(err);
  }
}

async function getEventByGridStats(req, res, next) {
  try {
    const gridStats = await prisma.event.groupBy({
      by: ['gridId'],
      _count: true,
    });

    const gridIds = gridStats.map(item => item.gridId);
    const grids = await prisma.grid.findMany({
      where: { id: { in: gridIds } },
      select: { id: true, name: true },
    });

    const gridMap = {};
    grids.forEach(grid => {
      gridMap[grid.id] = grid.name;
    });

    const result = gridStats.map(item => ({
      gridId: item.gridId,
      gridName: gridMap[item.gridId] || '',
      count: item._count,
    }));

    return success(res, result);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getDashboardStats,
  getEventTrendStats,
  getEventTypeStats,
  getEventByGridStats,
};
