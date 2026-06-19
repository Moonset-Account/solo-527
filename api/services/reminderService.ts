import prisma from '../prisma.js'
import type { RemindType, ReplyStatus } from '@prisma/client'

export async function createReminder(data: {
  contractId: number
  nodeId: number
  remindType: RemindType
  remindContent: string
  remindBy: string
  remindTo: string
}) {
  return prisma.reminderRecord.create({ data })
}

export async function getRemindersByContract(contractId: number) {
  return prisma.reminderRecord.findMany({
    where: { contractId },
    orderBy: { createdAt: 'desc' },
  })
}

export async function updateReminderReply(id: number, replyStatus: ReplyStatus) {
  return prisma.reminderRecord.update({
    where: { id },
    data: { replyStatus },
  })
}
