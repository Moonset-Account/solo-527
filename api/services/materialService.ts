import prisma from '../prisma.js'
import type { MaterialStatus } from '@prisma/client'

export async function getMaterialsByContract(contractId: number) {
  return prisma.materialItem.findMany({
    where: { contractId },
    orderBy: { id: 'asc' },
  })
}

export async function updateMaterialStatus(id: number, status: MaterialStatus) {
  const data: any = { status }
  if (status === 'SUBMITTED') {
    data.submittedAt = new Date()
  }
  return prisma.materialItem.update({
    where: { id },
    data,
  })
}

export async function batchRemind(materialIds: number[]) {
  const materials = await prisma.materialItem.findMany({
    where: { id: { in: materialIds } },
  })

  const reminders = []
  for (const material of materials) {
    const firstNode = await prisma.approvalNode.findFirst({
      where: { contractId: material.contractId },
      orderBy: { id: 'asc' },
    })
    const reminder = await prisma.reminderRecord.create({
      data: {
        contractId: material.contractId,
        nodeId: firstNode?.id ?? 0,
        remindType: 'SYSTEM',
        remindContent: `请尽快提交材料: ${material.materialName}`,
        remindBy: 'SYSTEM',
        remindTo: material.requiredBy,
      },
    })
    reminders.push(reminder)
  }

  return reminders
}
