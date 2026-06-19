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
  const reminder = await prisma.reminderRecord.findUnique({
    where: { id },
    select: { nodeId: true },
  })

  const updated = await prisma.reminderRecord.update({
    where: { id },
    data: { replyStatus },
  })

  if (replyStatus === 'REPLIED' && reminder) {
    const node = await prisma.approvalNode.findUnique({
      where: { id: reminder.nodeId },
      select: { status: true },
    })
    if (node && node.status === 'TIMEOUT') {
      await prisma.approvalNode.update({
        where: { id: reminder.nodeId },
        data: { status: 'PROCESSING' },
      })
    }
  }

  return updated
}
