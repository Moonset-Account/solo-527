import cron from 'node-cron'
import prisma from '../prisma.js'

export function startTimeoutChecker() {
  cron.schedule('*/5 * * * *', async () => {
    try {
      const activeNodes = await prisma.approvalNode.findMany({
        where: {
          status: { in: ['PENDING', 'PROCESSING'] },
        },
      })

      for (const node of activeNodes) {
        const elapsedMinutes = Math.round(
          (Date.now() - node.startedAt.getTime()) / 60000
        )

        if (elapsedMinutes > node.timeoutMinutes) {
          await prisma.approvalNode.update({
            where: { id: node.id },
            data: {
              status: 'TIMEOUT',
              elapsedMinutes,
            },
          })
        } else {
          await prisma.approvalNode.update({
            where: { id: node.id },
            data: { elapsedMinutes },
          })
        }
      }
    } catch (error) {
      console.error('Timeout checker error:', error)
    }
  })
}
