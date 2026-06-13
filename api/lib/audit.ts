import prisma from './prisma.js'

export async function logAudit(params: {
  operatorId: number
  action: string
  entityType: string
  entityId: number
  detail?: string
  alertId?: number
  accountRequestId?: number
}) {
  return prisma.auditLog.create({
    data: {
      operatorId: params.operatorId,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      detail: params.detail,
      alertId: params.alertId,
      accountRequestId: params.accountRequestId,
    },
  })
}
