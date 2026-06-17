import prisma from './prisma'

export interface HistoryContext {
  userId: string
  ipAddress?: string
  userAgent?: string
}

export async function recordHistory(
  entityType: string,
  entityId: string,
  action: string,
  context: HistoryContext,
  oldValues?: Record<string, any>,
  newValues?: Record<string, any>
) {
  try {
    await prisma.operationHistory.create({
      data: {
        entityType,
        entityId,
        action,
        userId: context.userId,
        oldValues: oldValues || undefined,
        newValues: newValues || undefined,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
      },
    })
  } catch (error) {
    console.error('Failed to record history:', error)
  }
}

export async function getHistory(entityType: string, entityId: string, page: number = 1, pageSize: number = 20) {
  const skip = (page - 1) * pageSize

  const [records, total] = await Promise.all([
    prisma.operationHistory.findMany({
      where: { entityType, entityId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    }),
    prisma.operationHistory.count({ where: { entityType, entityId } }),
  ])

  return { records, total, page, pageSize }
}

export async function getUserHistory(userId: string, page: number = 1, pageSize: number = 20) {
  const skip = (page - 1) * pageSize

  const [records, total] = await Promise.all([
    prisma.operationHistory.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
    }),
    prisma.operationHistory.count({ where: { userId } }),
  ])

  return { records, total, page, pageSize }
}
