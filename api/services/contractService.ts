import prisma from '../prisma.js'
import type { ContractStatus } from '@prisma/client'

export async function getContracts(status?: ContractStatus) {
  const where = status ? { status } : {}
  return prisma.contract.findMany({
    where,
    include: {
      approvalNodes: true,
      materialItems: true,
    },
    orderBy: { createdAt: 'desc' },
  })
}

export async function getContractById(id: number) {
  return prisma.contract.findUnique({
    where: { id },
    include: {
      approvalNodes: {
        include: { reminders: true },
        orderBy: { id: 'asc' },
      },
      reminderRecords: {
        orderBy: { createdAt: 'desc' },
      },
      materialItems: {
        orderBy: { id: 'asc' },
      },
    },
  })
}

export async function createContract(data: {
  contractNo: string
  title: string
  applicant: string
  department: string
  status?: ContractStatus
  isDuplicate?: boolean
  duplicateAffectedObjects?: string
  duplicateHandler?: string
  duplicateNextStep?: string
}) {
  return prisma.contract.create({ data })
}

export async function updateContractStatus(id: number, status: ContractStatus) {
  return prisma.contract.update({
    where: { id },
    data: { status },
  })
}

export async function getStuckNodes() {
  const nodes = await prisma.approvalNode.findMany({
    where: {
      status: { in: ['PENDING', 'PROCESSING'] },
    },
    include: {
      contract: {
        select: {
          id: true,
          contractNo: true,
          title: true,
          status: true,
        },
      },
    },
  })

  return nodes
    .filter((node) => {
      const elapsed = (Date.now() - node.startedAt.getTime()) / 60000
      return elapsed > node.timeoutMinutes * 0.8
    })
    .map((node) => ({
      contractId: node.contract.id,
      contractNo: node.contract.contractNo,
      contractTitle: node.contract.title,
      contractStatus: node.contract.status,
      nodeId: node.id,
      nodeName: node.nodeName,
      assignee: node.assignee,
      assigneeDepartment: node.assigneeDepartment,
      elapsedMinutes: Math.round((Date.now() - node.startedAt.getTime()) / 60000),
      timeoutMinutes: node.timeoutMinutes,
      isOverdue: Math.round((Date.now() - node.startedAt.getTime()) / 60000) > node.timeoutMinutes,
      startedAt: node.startedAt.toISOString(),
    }))
}
