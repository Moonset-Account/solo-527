import { prisma } from './prisma'
import type { AuthUser } from './auth'

export interface AuditLogData {
  operationType: string
  sourceType: string
  sourceId: number
  sourceNo?: string
  oldValue?: any
  newValue?: any
  changeReason?: string
  patientId?: number
  medicalRecordId?: number
  courseId?: number
  followUpId?: number
  billingId?: number
  archiveId?: number
}

export const createAuditLog = async (
  user: AuthUser,
  logData: AuditLogData
) => {
  await prisma.auditLog.create({
    data: {
      operationType: logData.operationType,
      sourceType: logData.sourceType,
      sourceId: logData.sourceId,
      sourceNo: logData.sourceNo || null,
      oldValue: logData.oldValue || null,
      newValue: logData.newValue || null,
      changeReason: logData.changeReason || null,
      operatorId: user.id,
      patientId: logData.patientId || null,
      medicalRecordId: logData.medicalRecordId || null,
      courseId: logData.courseId || null,
      followUpId: logData.followUpId || null,
      billingId: logData.billingId || null,
      archiveId: logData.archiveId || null
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
