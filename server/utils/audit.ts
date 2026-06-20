import { prisma } from './prisma'
import type { AuthUser } from './auth'

export interface AuditLogData {
  operationType: string
  sourceType: string
  sourceId: number
  oldValue?: any
  newValue?: any
  changeReason?: string
}

export const createAuditLog = async (
  user: AuthUser,
  logData: AuditLogData
) => {
  await prisma.auditLog.create({
    data: {
      ...logData,
      oldValue: logData.oldValue ? JSON.stringify(logData.oldValue) : null,
      newValue: logData.newValue ? JSON.stringify(logData.newValue) : null,
      operatorId: user.id
    }
  })
}

export const createDataSource = async (
  sourceType: string,
  sourceId: number,
  sourceNo: string,
  targetType: string,
  targetId: number,
  targetNo: string,
  relation: string,
  remark?: string
) => {
  await prisma.dataSource.upsert({
    where: {
      sourceType_sourceId_targetType_targetId_relation: {
        sourceType,
        sourceId,
        targetType,
        targetId,
        relation
      }
    },
    update: {
      sourceNo,
      targetNo,
      remark
    },
    create: {
      sourceType,
      sourceId,
      sourceNo,
      targetType,
      targetId,
      targetNo,
      relation,
      remark
    }
  })
}

export const getDataSource = async (
  targetType: string,
  targetId: number
) => {
  return prisma.dataSource.findMany({
    where: {
      targetType,
      targetId
    },
    orderBy: {
      createdAt: 'desc'
    }
  })
}
