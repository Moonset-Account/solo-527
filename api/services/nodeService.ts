import prisma from '../prisma.js'
import type { NodeStatus } from '@prisma/client'

export async function getNodeById(id: number) {
  return prisma.approvalNode.findUnique({
    where: { id },
    include: {
      reminders: {
        orderBy: { createdAt: 'desc' },
      },
    },
  })
}

export async function updateNodeStatus(id: number, status: NodeStatus) {
  const data: any = { status }
  if (status === 'COMPLETED') {
    data.completedAt = new Date()
  }

  const node = await prisma.approvalNode.findUnique({
    where: { id },
    select: { contractId: true },
  })

  const updated = await prisma.approvalNode.update({
    where: { id },
    data,
  })

  if (status === 'COMPLETED' && node) {
    const contract = await prisma.contract.findUnique({
      where: { id: node.contractId },
      select: { status: true },
    })
    if (contract && contract.status === 'PENDING') {
      await prisma.contract.update({
        where: { id: node.contractId },
        data: { status: 'IN_PROGRESS' },
      })
    }
  }

  return updated
}
