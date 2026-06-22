import prisma from '../config/prisma.js';
import { parsePagination } from '../utils/common.js';
import { LicenseStatus } from '@prisma/client';

export async function getTrialList(query) {
  const { page, pageSize, skip, take } = parsePagination(query);
  const { status, department, pluginId, keyword } = query;

  const where = {
    type: 'TRIAL',
  };

  if (status === 'ACTIVE') {
    where.status = LicenseStatus.ACTIVE;
  } else if (status === 'EXPIRED') {
    where.status = LicenseStatus.EXPIRED;
  } else if (status === 'EXPIRING_SOON') {
    const sevenDaysLater = new Date();
    sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);
    where.status = LicenseStatus.ACTIVE;
    where.trialEndDate = { lte: sevenDaysLater };
  }

  if (department) {
    where.user = { department };
  }
  if (pluginId) {
    where.pluginId = Number(pluginId);
  }
  if (keyword) {
    where.OR = [
      { user: { name: { contains: keyword } } },
      { plugin: { name: { contains: keyword } } },
    ];
  }

  const [list, total] = await Promise.all([
    prisma.license.findMany({
      where,
      skip,
      take,
      orderBy: { trialEndDate: 'asc' },
      include: {
        plugin: { select: { id: true, name: true, icon: true } },
        plan: { select: { id: true, name: true, price: true } },
        user: { select: { id: true, name: true, department: true, email: true } },
        application: { select: { id: true, reason: true } },
        trialHandles: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: { handler: { select: { name: true } } },
        },
      },
    }),
    prisma.license.count({ where }),
  ]);

  const today = new Date();
  const listWithInfo = list.map(license => {
    const diffTime = new Date(license.trialEndDate) - today;
    const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    let trialStatus = 'ACTIVE';
    if (daysLeft <= 0) trialStatus = 'EXPIRED';
    else if (daysLeft <= 3) trialStatus = 'URGENT';
    else if (daysLeft <= 7) trialStatus = 'EXPIRING_SOON';

    return {
      ...license,
      daysLeft,
      trialStatus,
      lastHandle: license.trialHandles[0] || null,
    };
  });

  return { list: listWithInfo, total, page, pageSize };
}

export async function handleTrial(licenseId, handlerId, data) {
  const { result, remark, extendDays = 0, planId = null } = data;

  const license = await prisma.license.findUnique({
    where: { id: Number(licenseId) },
    include: { plan: true, application: true },
  });

  if (!license || license.type !== 'TRIAL') {
    throw new Error('试用授权不存在');
  }

  if (result === 'CONVERT' && !remark) {
    throw new Error('试用转正必须填写备注');
  }

  if (result === 'EXTEND' && !remark) {
    throw new Error('试用延期必须填写备注');
  }

  await prisma.trialHandleRecord.create({
    data: {
      licenseId: Number(licenseId),
      handlerId,
      result,
      remark: remark || '',
      extendDays: result === 'EXTEND' ? extendDays : 0,
    },
  });

  let updatedLicense;

  if (result === 'CONVERT') {
    const targetPlanId = planId || license.planId;
    const plan = await prisma.pricingPlan.findUnique({ where: { id: targetPlanId } });
    if (!plan) throw new Error('套餐不存在');

    const now = new Date();
    const endDate = new Date();
    if (plan.billingCycle === 'MONTHLY') endDate.setMonth(endDate.getMonth() + 1);
    else if (plan.billingCycle === 'QUARTERLY') endDate.setMonth(endDate.getMonth() + 3);
    else endDate.setFullYear(endDate.getFullYear() + 1);

    updatedLicense = await prisma.license.update({
      where: { id: Number(licenseId) },
      data: {
        type: 'PAID',
        planId: targetPlanId,
        startDate: now,
        endDate,
        trialEndDate: null,
        remarks: remark ? `试用转正: ${remark}` : '试用转正',
      },
    });
  } else if (result === 'CLOSE') {
    updatedLicense = await prisma.license.update({
      where: { id: Number(licenseId) },
      data: {
        status: LicenseStatus.CANCELLED,
        remarks: remark ? `试用关闭: ${remark}` : '试用关闭',
      },
    });
  } else if (result === 'EXTEND') {
    const newEndDate = new Date(license.trialEndDate);
    newEndDate.setDate(newEndDate.getDate() + extendDays);

    updatedLicense = await prisma.license.update({
      where: { id: Number(licenseId) },
      data: {
        trialEndDate: newEndDate,
        endDate: newEndDate,
        remarks: remark ? `试用延期${extendDays}天: ${remark}` : `试用延期${extendDays}天`,
      },
    });
  }

  return updatedLicense;
}
