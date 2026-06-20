import { prisma } from './prisma'

export interface LogInput {
  operator: string
  action: string
  detail?: string
  issueId?: number
  rectificationId?: number
}

export async function recordOperationLog(input: LogInput) {
  try {
    await prisma.operationLog.create({
      data: {
        operator: input.operator,
        action: input.action,
        detail: input.detail || null,
        issueId: input.issueId,
        rectificationId: input.rectificationId
      }
    })
  } catch (e) {
    console.error('[recordOperationLog] failed', e)
  }
}
