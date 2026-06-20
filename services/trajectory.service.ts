import { prisma } from '@/lib/prisma';
import type { TrajectoryInput } from '@/lib/validation';

export async function getTrajectoryByTicketId(ticketId: string) {
  const trajectory = await prisma.trajectory.findMany({
    where: { ticketId },
    orderBy: { createdAt: 'asc' },
    include: {
      operator: { select: { name: true, role: true } },
      slaRule: { select: { id: true, name: true } },
    },
  });

  return trajectory;
}

export async function addTrajectory(data: TrajectoryInput, operatorId: string) {
  const trajectory = await prisma.trajectory.create({
    data: {
      ...data,
      operatorId,
    },
  });

  await prisma.ticket.update({
    where: { id: data.ticketId },
    data: { updatedAt: new Date() },
  });

  return trajectory;
}

export async function getTrajectoryStats(ticketId: string) {
  const trajectory = await getTrajectoryByTicketId(ticketId);
  
  const changes = [];
  for (let i = 0; i < trajectory.length - 1; i++) {
    const before = trajectory[i].afterState as Record<string, unknown>;
    const after = trajectory[i + 1].beforeState as Record<string, unknown>;
    changes.push({
      from: trajectory[i].actionType,
      to: trajectory[i + 1].actionType,
      timeDiff: trajectory[i + 1].createdAt.getTime() - trajectory[i].createdAt.getTime(),
    });
  }

  const slaChanges = trajectory.filter(t => t.actionType === 'SLA_CHANGE');
  const improvements = trajectory.filter(t => t.actionType === 'IMPROVEMENT');

  const totalTime = trajectory.length > 1
    ? trajectory[trajectory.length - 1].createdAt.getTime() - trajectory[0].createdAt.getTime()
    : 0;

  return {
    totalSteps: trajectory.length,
    totalTime,
    avgStepTime: changes.length > 0 ? totalTime / changes.length : 0,
    slaChangeCount: slaChanges.length,
    improvementCount: improvements.length,
    changes,
  };
}

export async function getTicketsWithTrajectory(params: {
  status?: string;
  priority?: string;
  page?: number;
  pageSize?: number;
}) {
  const { status, priority, page = 1, pageSize = 20 } = params;
  const skip = (page - 1) * pageSize;

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (priority) where.priority = priority;

  const [tickets, total] = await Promise.all([
    prisma.ticket.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { updatedAt: 'desc' },
      include: {
        slaRule: { select: { id: true, name: true, responseTime: true, resolutionTime: true } },
        _count: { select: { trajectories: true } },
      },
    }),
    prisma.ticket.count({ where }),
  ]);

  return { tickets, total, page, pageSize };
}

export async function getSlaComparison(trajectoryId: string) {
  const trajectory = await prisma.trajectory.findUnique({
    where: { id: trajectoryId },
    include: { slaRule: true },
  });

  if (!trajectory || !trajectory.slaRuleSnapshot) return null;

  return {
    currentSla: trajectory.slaRule,
    snapshotSla: trajectory.slaRuleSnapshot as Record<string, unknown>,
    beforeState: trajectory.beforeState as Record<string, unknown>,
    afterState: trajectory.afterState as Record<string, unknown>,
  };
}
