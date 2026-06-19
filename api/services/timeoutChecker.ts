import cron from 'node-cron'
import prisma from '../prisma.js'

export function startTimeoutChecker() {
  cron.schedule('*/5 * * * *', async () => {
    try {
      const activeNodes = await prisma.approvalNode.findMany({
        where: {
          status: { in: ['PENDING', 'PROCESSING', 'TIMEOUT'] },
        },
        include: { contract: true },
      })

      for (const node of activeNodes) {
        const elapsedMinutes = Math.round(
          (Date.now() - node.startedAt.getTime()) / 60000
        )

        const updatedData: any = { elapsedMinutes }
        if (elapsedMinutes > node.timeoutMinutes && node.status !== 'TIMEOUT') {
          updatedData.status = 'TIMEOUT'
        }

        await prisma.approvalNode.update({
          where: { id: node.id },
          data: updatedData,
        })

        if (elapsedMinutes > node.timeoutMinutes * 0.8) {
          const isOverdue = elapsedMinutes > node.timeoutMinutes
          const reminderContent = isOverdue
            ? `节点「${node.nodeName}」已超时 ${elapsedMinutes - node.timeoutMinutes} 分钟，请尽快处理合同「${node.contract.title}」`
            : `节点「${node.nodeName}」即将超时（剩余 ${node.timeoutMinutes - elapsedMinutes} 分钟），请尽快处理合同「${node.contract.title}」`

          const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000)
          const recentReminder = await prisma.reminderRecord.findFirst({
            where: {
              nodeId: node.id,
              createdAt: { gte: twoHoursAgo },
              remindType: 'SYSTEM',
            },
          })

          if (!recentReminder) {
            await prisma.reminderRecord.create({
              data: {
                contractId: node.contractId,
                nodeId: node.id,
                remindType: 'SYSTEM',
                remindContent: reminderContent,
                remindBy: 'SYSTEM',
                remindTo: node.assignee,
              },
            })
          }
        }
      }
    } catch (error) {
      console.error('Timeout checker error:', error)
    }
  })
}
