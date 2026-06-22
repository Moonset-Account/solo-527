import prisma from '../config/prisma.js';
import { parsePagination } from '../utils/common.js';
import { ApplicationStatus } from '@prisma/client';

export async function createApplication(userId, data) {
  const { pluginId, planId, reason, seatCount, trialDays = 0 } = data;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new Error('用户不存在');
  }

  const plugin = await prisma.plugin.findUnique({ where: { id: pluginId } });
  if (!plugin) {
    throw new Error('插件不存在');
  }

  const plan = await prisma.pricingPlan.findUnique({ where: { id: planId } });
  if (!plan || plan.pluginId !== pluginId) {
    throw new Error('套餐不存在或不属于该插件');
  }

  const application = await prisma.application.create({
    data: {
      pluginId,
      planId,
      userId,
      applicantName: user.name,
      department: user.department,
      reason,
      status: ApplicationStatus.PENDING,
      seatCount: seatCount || plan.seatCount,
      trialDays,
    },
    include: {
      plugin: true,
      plan: true,
      user: {
        select: {
          id: true,
          username: true,
          name: true,
          department: true,
        },
      },
    },
  });

  return application;
}

export async function getApplicationList(userId, role, query) {
  const { page, pageSize, skip, take } = parsePagination(query);
  const { status, pluginId, department, keyword } = query;

  const where = {};
  
  if (role === 'USER') {
    where.userId = userId;
  }
  
  if (status) {
    where.status = status;
  }
  if (pluginId) {
    where.pluginId = Number(pluginId);
  }
  if (department) {
    where.department = department;
  }
  if (keyword) {
    where.OR = [
      { applicantName: { contains: keyword } },
      { reason: { contains: keyword } },
    ];
  }

  const [list, total] = await Promise.all([
    prisma.application.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        plugin: { select: { id: true, name: true, icon: true } },
        plan: { select: { id: true, name: true, price: true, billingCycle: true } },
        user: { select: { id: true, name: true, department: true } },
        approver: { select: { id: true, name: true } },
      },
    }),
    prisma.application.count({ where }),
  ]);

  return { list, total, page, pageSize };
}

export async function getApplicationDetail(id, userId, role) {
  const application = await prisma.application.findUnique({
    where: { id: Number(id) },
    include: {
      plugin: true,
      plan: true,
      user: {
        select: {
          id: true,
          username: true,
          name: true,
          email: true,
          department: true,
        },
      },
      approver: { select: { id: true, name: true } },
      license: true,
    },
  });

  if (!application) {
    throw new Error('申请不存在');
  }

  if (role === 'USER' && application.userId !== userId) {
    throw new Error('无权查看该申请');
  }

  return application;
}

export async function updateApplicationStatus(id, handlerId, data) {
  const { status, processingNote, closeReason, trialDays } = data;

  const application = await prisma.application.findUnique({
    where: { id: Number(id) },
    include: { plan: true, user: true },
  });

  if (!application) {
    throw new Error('申请不存在');
  }

  if (application.status === ApplicationStatus.COMPLETED || 
      application.status === ApplicationStatus.CLOSED_ABNORMAL) {
    throw new Error('该申请已结束，无法修改');
  }

  const updateData = {
    status,
    processingNote: processingNote || application.processingNote,
    closeReason: closeReason || application.closeReason,
    trialDays: trialDays !== undefined ? trialDays : application.trialDays,
  };

  if (status === ApplicationStatus.COMPLETED) {
    updateData.approvedBy = handlerId;
    updateData.approvedAt = new Date();
  }

  const updatedApp = await prisma.application.update({
    where: { id: Number(id) },
    data: updateData,
    include: {
      plugin: true,
      plan: true,
      user: { select: { id: true, name: true, department: true } },
    },
  });

  if (status === ApplicationStatus.COMPLETED && !application.license) {
    const now = new Date();
    const endDate = new Date();
    const trialDaysVal = trialDays !== undefined ? trialDays : application.trialDays;
    
    if (trialDaysVal > 0) {
      endDate.setDate(endDate.getDate() + trialDaysVal);
      await prisma.license.create({
        data: {
          pluginId: application.pluginId,
          userId: application.userId,
          applicationId: application.id,
          planId: application.planId,
          type: 'TRIAL',
          status: 'ACTIVE',
          seatCount: application.seatCount,
          usedSeats: 0,
          startDate: now,
          endDate: endDate,
          trialEndDate: endDate,
        },
      });
    } else {
      if (application.plan.billingCycle === 'MONTHLY') {
        endDate.setMonth(endDate.getMonth() + 1);
      } else if (application.plan.billingCycle === 'QUARTERLY') {
        endDate.setMonth(endDate.getMonth() + 3);
      } else {
        endDate.setFullYear(endDate.getFullYear() + 1);
      }
      await prisma.license.create({
        data: {
          pluginId: application.pluginId,
          userId: application.userId,
          applicationId: application.id,
          planId: application.planId,
          type: 'PAID',
          status: 'ACTIVE',
          seatCount: application.seatCount,
          usedSeats: 0,
          startDate: now,
          endDate: endDate,
        },
      });
    }
  }

  return updatedApp;
}
