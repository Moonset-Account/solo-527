import prisma from '../config/prisma.js';
import { parsePagination } from '../utils/common.js';

export async function getRenewalList(query) {
  const { page, pageSize, skip, take } = parsePagination(query);
  const { department, pluginId, daysLeft = 30 } = query;

  const today = new Date();
  const targetDate = new Date(today.getTime() + Number(daysLeft) * 24 * 60 * 60 * 1000);

  const where = {
    status: 'ACTIVE',
    endDate: { lte: targetDate },
  };

  if (department) {
    where.user = { department };
  }
  if (pluginId) {
    where.pluginId = Number(pluginId);
  }

  const [list, total] = await Promise.all([
    prisma.license.findMany({
      where,
      skip,
      take,
      orderBy: { endDate: 'asc' },
      include: {
        plugin: { select: { id: true, name: true, icon: true } },
        plan: { select: { id: true, name: true, price: true, billingCycle: true } },
        user: { select: { id: true, name: true, department: true, email: true } },
        application: { select: { id: true, reason: true } },
      },
    }),
    prisma.license.count({ where }),
  ]);

  const listWithDays = list.map(license => {
    const diffTime = new Date(license.endDate) - today;
    const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return {
      ...license,
      daysLeft,
      isExpiringSoon: daysLeft <= 7,
      renewalStatus: daysLeft <= 0 ? 'EXPIRED' : daysLeft <= 7 ? 'URGENT' : 'PENDING',
    };
  });

  return { list: listWithDays, total, page, pageSize };
}

export async function getDepartmentSummary(query) {
  const { period = 'monthly', department } = query;

  const licenses = await prisma.license.findMany({
    where: { status: 'ACTIVE' },
    include: {
      plugin: { select: { id: true, name: true, category: true } },
      plan: { select: { id: true, name: true, price: true, billingCycle: true } },
      user: { select: { id: true, name: true, department: true } },
    },
  });

  const deptMap = {};

  licenses.forEach(license => {
    const dept = license.user.department;
    if (department && dept !== department) return;

    if (!deptMap[dept]) {
      deptMap[dept] = {
        department: dept,
        licenseCount: 0,
        totalSeats: 0,
        usedSeats: 0,
        monthlyCost: 0,
        plugins: {},
      };
    }

    deptMap[dept].licenseCount += 1;
    deptMap[dept].totalSeats += license.seatCount;
    deptMap[dept].usedSeats += license.usedSeats;

    let monthlyPrice = Number(license.plan.price);
    if (license.plan.billingCycle === 'QUARTERLY') {
      monthlyPrice = monthlyPrice / 3;
    } else if (license.plan.billingCycle === 'YEARLY') {
      monthlyPrice = monthlyPrice / 12;
    }
    deptMap[dept].monthlyCost += monthlyPrice * license.seatCount;

    const pluginName = license.plugin.name;
    if (!deptMap[dept].plugins[pluginName]) {
      deptMap[dept].plugins[pluginName] = {
        pluginId: license.pluginId,
        pluginName,
        category: license.plugin.category,
        licenseCount: 0,
        totalSeats: 0,
        usedSeats: 0,
        monthlyCost: 0,
      };
    }
    deptMap[dept].plugins[pluginName].licenseCount += 1;
    deptMap[dept].plugins[pluginName].totalSeats += license.seatCount;
    deptMap[dept].plugins[pluginName].usedSeats += license.usedSeats;
    deptMap[dept].plugins[pluginName].monthlyCost += monthlyPrice * license.seatCount;
  });

  const departmentData = Object.values(deptMap).map(dept => ({
    ...dept,
    monthlyCost: Math.round(dept.monthlyCost * 100) / 100,
    seatUtilization: dept.totalSeats > 0 ? Math.round((dept.usedSeats / dept.totalSeats) * 100) : 0,
    plugins: Object.values(dept.plugins).map(p => ({
      ...p,
      monthlyCost: Math.round(p.monthlyCost * 100) / 100,
      seatUtilization: p.totalSeats > 0 ? Math.round((p.usedSeats / p.totalSeats) * 100) : 0,
    })),
  }));

  const totalCost = departmentData.reduce((sum, d) => sum + d.monthlyCost, 0);
  const totalLicenses = departmentData.reduce((sum, d) => sum + d.licenseCount, 0);

  return {
    summary: {
      totalDepartments: departmentData.length,
      totalLicenses,
      totalMonthlyCost: Math.round(totalCost * 100) / 100,
      period,
    },
    departmentData,
  };
}
