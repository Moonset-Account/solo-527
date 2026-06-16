import { LogAction } from '@prisma/client'
import { prisma } from './prisma'

interface LogOptions {
  userId: string
  action: LogAction
  targetType: string
  targetId: string
  oldValue?: unknown
  newValue?: unknown
  detail?: string
  ipAddress?: string
  userAgent?: string
}

export async function createLog(options: LogOptions) {
  try {
    await prisma.operationLog.create({
      data: {
        userId: options.userId,
        action: options.action,
        targetType: options.targetType,
        targetId: options.targetId,
        oldValue: options.oldValue as object,
        newValue: options.newValue as object,
        detail: options.detail,
        ipAddress: options.ipAddress,
        userAgent: options.userAgent,
      },
    })
  } catch (error) {
    console.error('Failed to create operation log:', error)
  }
}

export async function createAuditLog(
  entityType: string,
  entityId: string,
  fieldName: string,
  oldValue: string | null,
  newValue: string | null,
  changedBy: string,
) {
  try {
    await prisma.auditLog.create({
      data: {
        entityType,
        entityId,
        fieldName,
        oldValue,
        newValue,
        changedBy,
      },
    })
  } catch (error) {
    console.error('Failed to create audit log:', error)
  }
}
