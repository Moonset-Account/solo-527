import type { LogActionType, Prisma } from '@prisma/client'
import { prisma } from '../plugins/prisma'

interface LogOptions {
  actionType: LogActionType
  userId?: number | null
  alertId?: number | null
  changeId?: number | null
  beforeData?: Record<string, unknown> | null
  afterData?: Record<string, unknown> | null
  note?: string
  ip?: string
}

export async function createLog(options: LogOptions) {
  try {
    const data: Prisma.OperationLogCreateInput = {
      actionType: options.actionType
    }

    if (options.userId) {
      data.user = { connect: { id: options.userId } }
    }
    if (options.alertId) {
      data.alert = { connect: { id: options.alertId } }
    }
    if (options.changeId) {
      data.changeRequest = { connect: { id: options.changeId } }
    }
    if (options.beforeData) {
      data.beforeData = options.beforeData as Prisma.InputJsonValue
    }
    if (options.afterData) {
      data.afterData = options.afterData as Prisma.InputJsonValue
    }
    if (options.note) {
      data.note = options.note
    }
    if (options.ip) {
      data.ip = options.ip
    }

    return await prisma.operationLog.create({ data })
  } catch (e) {
    console.error('Failed to create log:', e)
    return null
  }
}

export function diffChanges(before: Record<string, unknown>, after: Record<string, unknown>): { changed: Record<string, unknown>; beforeData: Record<string, unknown>; afterData: Record<string, unknown> } {
  const changed: Record<string, unknown> = {}
  const beforeData: Record<string, unknown> = {}
  const afterData: Record<string, unknown> = {}
  const allKeys = new Set([...Object.keys(before), ...Object.keys(after)])

  for (const key of allKeys) {
    const b = before[key]
    const a = after[key]
    if (JSON.stringify(b) !== JSON.stringify(a)) {
      changed[key] = { before: b, after: a }
      beforeData[key] = b
      afterData[key] = a
    }
  }

  return { changed, beforeData, afterData }
}
