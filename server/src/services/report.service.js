import prisma from '../config/prisma.js';

export async function getUsageTrend(query) {
  const { pluginId, startDate, endDate, type = 'count' } = query;

  const where = {};
  if (pluginId) {
    where.pluginId = Number(pluginId);
  }
  if (startDate) {
    where.date = { ...where.date, gte: new Date(startDate) };
  }
  if (endDate) {
    const end = new Date(endDate);
    end.setHours(23, 59, 59);
    where.date = { ...where.date, lte: end };
  }

  const records = await prisma.usageRecord.findMany({
    where,
    orderBy: { date: 'asc' },
    include: {
      plugin: { select: { id: true, name: true } },
    },
  });

  const dateMap = {};
  records.forEach(record => {
    const dateStr = record.date.toISOString().split('T')[0];
    if (!dateMap[dateStr]) {
      dateMap[dateStr] = {
        date: dateStr,
        usageCount: 0,
        activeUsers: 0,
      };
    }
    dateMap[dateStr].usageCount += record.usageCount;
    dateMap[dateStr].activeUsers += record.activeUsers;
  });

  const data = Object.values(dateMap).sort((a, b) => a.date.localeCompare(b.date));

  const pluginIds = [...new Set(records.map(r => r.pluginId))];
  const plugins = await prisma.plugin.findMany({
    where: { id: { in: pluginIds } },
    select: { id: true, name: true, icon: true },
  });

  const pluginData = plugins.map(plugin => {
    const pluginRecords = records.filter(r => r.pluginId === plugin.id);
    const series = pluginRecords.map(r => ({
      date: r.date.toISOString().split('T')[0],
      value: type === 'count' ? r.usageCount : r.activeUsers,
    }));
    return {
      plugin,
      series,
      total: pluginRecords.reduce((sum, r) => sum + (type === 'count' ? r.usageCount : r.activeUsers), 0),
    };
  });

  return {
    summary: {
      totalUsage: records.reduce((sum, r) => sum + r.usageCount, 0),
      totalActiveUsers: records.reduce((sum, r) => sum + r.activeUsers, 0),
      dateRange: { start: startDate, end: endDate },
    },
    overallData: data,
    pluginData,
  };
}

export async function getSeatUtilization(query) {
  const { department, pluginId } = query;

  const where = { status: 'ACTIVE' };
  if (pluginId) {
    where.pluginId = Number(pluginId);
  }

  const licenses = await prisma.license.findMany({
    where,
    include: {
      user: { select: { id: true, name: true, department: true } },
      plugin: { select: { id: true, name: true, icon: true } },
    },
  });

  const deptMap = {};
  licenses.forEach(license => {
    const dept = license.user.department;
    if (department && dept !== department) return;

    if (!deptMap[dept]) {
      deptMap[dept] = {
        department: dept,
        totalSeats: 0,
        usedSeats: 0,
        licenseCount: 0,
        plugins: {},
      };
    }
    deptMap[dept].totalSeats += license.seatCount;
    deptMap[dept].usedSeats += license.usedSeats;
    deptMap[dept].licenseCount += 1;

    const pluginName = license.plugin.name;
    if (!deptMap[dept].plugins[pluginName]) {
      deptMap[dept].plugins[pluginName] = {
        pluginId: license.pluginId,
        pluginName,
        totalSeats: 0,
        usedSeats: 0,
      };
    }
    deptMap[dept].plugins[pluginName].totalSeats += license.seatCount;
    deptMap[dept].plugins[pluginName].usedSeats += license.usedSeats;
  });

  const departmentData = Object.values(deptMap).map(dept => ({
    ...dept,
    utilizationRate: dept.totalSeats > 0 ? Math.round((dept.usedSeats / dept.totalSeats) * 100) : 0,
    plugins: Object.values(dept.plugins).map(p => ({
      ...p,
      utilizationRate: p.totalSeats > 0 ? Math.round((p.usedSeats / p.totalSeats) * 100) : 0,
    })),
  }));

  const totalSeats = licenses.reduce((sum, l) => sum + l.seatCount, 0);
  const totalUsed = licenses.reduce((sum, l) => sum + l.usedSeats, 0);

  return {
    summary: {
      totalLicenses: licenses.length,
      totalSeats,
      totalUsed,
      overallUtilization: totalSeats > 0 ? Math.round((totalUsed / totalSeats) * 100) : 0,
      departmentCount: departmentData.length,
    },
    departmentData,
  };
}
