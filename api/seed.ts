import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  await prisma.reminderRecord.deleteMany()
  await prisma.materialItem.deleteMany()
  await prisma.approvalNode.deleteMany()
  await prisma.contract.deleteMany()

  const now = new Date()

  const contract1 = await prisma.contract.create({
    data: {
      contractNo: 'CT-2026-001',
      title: '办公设备采购合同',
      applicant: '张三',
      department: '行政部',
      status: 'PENDING',
    },
  })

  const contract2 = await prisma.contract.create({
    data: {
      contractNo: 'CT-2026-002',
      title: '软件开发服务合同',
      applicant: '李四',
      department: '技术部',
      status: 'PENDING',
      isDuplicate: true,
      duplicateAffectedObjects: 'CT-2025-089, CT-2025-102',
      duplicateHandler: '王五',
      duplicateNextStep: '合并审批流程，统一处理重复合同',
    },
  })

  const contract3 = await prisma.contract.create({
    data: {
      contractNo: 'CT-2026-003',
      title: '年度物业服务合同',
      applicant: '赵六',
      department: '后勤部',
      status: 'IN_PROGRESS',
    },
  })

  const contract4 = await prisma.contract.create({
    data: {
      contractNo: 'CT-2026-004',
      title: '市场推广合作协议',
      applicant: '孙七',
      department: '市场部',
      status: 'COMPLETED',
    },
  })

  const contract5 = await prisma.contract.create({
    data: {
      contractNo: 'CT-2026-005',
      title: '法律咨询服务合同',
      applicant: '周八',
      department: '法务部',
      status: 'ABNORMAL_CLOSED',
    },
  })

  await prisma.approvalNode.createMany({
    data: [
      {
        contractId: contract1.id,
        nodeName: '部门审核',
        assignee: '张主管',
        assigneeDepartment: '行政部',
        status: 'PROCESSING',
        timeoutMinutes: 60,
        elapsedMinutes: 50,
        startedAt: new Date(now.getTime() - 50 * 60000),
      },
      {
        contractId: contract1.id,
        nodeName: '财务审核',
        assignee: '李会计',
        assigneeDepartment: '财务部',
        status: 'PENDING',
        timeoutMinutes: 120,
        elapsedMinutes: 0,
        startedAt: now,
      },
      {
        contractId: contract1.id,
        nodeName: '总经理审批',
        assignee: '王总',
        assigneeDepartment: '总经理办公室',
        status: 'PENDING',
        timeoutMinutes: 180,
        elapsedMinutes: 0,
        startedAt: now,
      },
      {
        contractId: contract2.id,
        nodeName: '部门审核',
        assignee: '刘主管',
        assigneeDepartment: '技术部',
        status: 'COMPLETED',
        timeoutMinutes: 60,
        elapsedMinutes: 35,
        startedAt: new Date(now.getTime() - 100 * 60000),
        completedAt: new Date(now.getTime() - 65 * 60000),
      },
      {
        contractId: contract2.id,
        nodeName: '技术评审',
        assignee: '陈工',
        assigneeDepartment: '技术部',
        status: 'PROCESSING',
        timeoutMinutes: 90,
        elapsedMinutes: 80,
        startedAt: new Date(now.getTime() - 80 * 60000),
      },
      {
        contractId: contract2.id,
        nodeName: '总经理审批',
        assignee: '王总',
        assigneeDepartment: '总经理办公室',
        status: 'PENDING',
        timeoutMinutes: 180,
        elapsedMinutes: 0,
        startedAt: now,
      },
      {
        contractId: contract3.id,
        nodeName: '部门审核',
        assignee: '钱主管',
        assigneeDepartment: '后勤部',
        status: 'COMPLETED',
        timeoutMinutes: 60,
        elapsedMinutes: 25,
        startedAt: new Date(now.getTime() - 200 * 60000),
        completedAt: new Date(now.getTime() - 175 * 60000),
      },
      {
        contractId: contract3.id,
        nodeName: '财务审核',
        assignee: '吴会计',
        assigneeDepartment: '财务部',
        status: 'COMPLETED',
        timeoutMinutes: 120,
        elapsedMinutes: 90,
        startedAt: new Date(now.getTime() - 175 * 60000),
        completedAt: new Date(now.getTime() - 85 * 60000),
      },
      {
        contractId: contract3.id,
        nodeName: '总经理审批',
        assignee: '王总',
        assigneeDepartment: '总经理办公室',
        status: 'PROCESSING',
        timeoutMinutes: 60,
        elapsedMinutes: 55,
        startedAt: new Date(now.getTime() - 55 * 60000),
      },
      {
        contractId: contract3.id,
        nodeName: '合同盖章',
        assignee: '郑秘书',
        assigneeDepartment: '行政部',
        status: 'PENDING',
        timeoutMinutes: 30,
        elapsedMinutes: 0,
        startedAt: now,
      },
      {
        contractId: contract4.id,
        nodeName: '部门审核',
        assignee: '冯主管',
        assigneeDepartment: '市场部',
        status: 'COMPLETED',
        timeoutMinutes: 60,
        elapsedMinutes: 20,
        startedAt: new Date(now.getTime() - 500 * 60000),
        completedAt: new Date(now.getTime() - 480 * 60000),
      },
      {
        contractId: contract4.id,
        nodeName: '财务审核',
        assignee: '褚会计',
        assigneeDepartment: '财务部',
        status: 'COMPLETED',
        timeoutMinutes: 120,
        elapsedMinutes: 45,
        startedAt: new Date(now.getTime() - 480 * 60000),
        completedAt: new Date(now.getTime() - 435 * 60000),
      },
      {
        contractId: contract4.id,
        nodeName: '总经理审批',
        assignee: '王总',
        assigneeDepartment: '总经理办公室',
        status: 'COMPLETED',
        timeoutMinutes: 180,
        elapsedMinutes: 60,
        startedAt: new Date(now.getTime() - 435 * 60000),
        completedAt: new Date(now.getTime() - 375 * 60000),
      },
      {
        contractId: contract5.id,
        nodeName: '部门审核',
        assignee: '卫主管',
        assigneeDepartment: '法务部',
        status: 'COMPLETED',
        timeoutMinutes: 60,
        elapsedMinutes: 30,
        startedAt: new Date(now.getTime() - 300 * 60000),
        completedAt: new Date(now.getTime() - 270 * 60000),
      },
      {
        contractId: contract5.id,
        nodeName: '法务评审',
        assignee: '蒋律师',
        assigneeDepartment: '法务部',
        status: 'TIMEOUT',
        timeoutMinutes: 60,
        elapsedMinutes: 95,
        startedAt: new Date(now.getTime() - 270 * 60000),
        completedAt: new Date(now.getTime() - 175 * 60000),
      },
      {
        contractId: contract5.id,
        nodeName: '总经理审批',
        assignee: '王总',
        assigneeDepartment: '总经理办公室',
        status: 'PENDING',
        timeoutMinutes: 180,
        elapsedMinutes: 0,
        startedAt: now,
      },
    ],
  })

  const nodes = await prisma.approvalNode.findMany()
  const node1c1 = nodes.find((n) => n.contractId === contract1.id && n.nodeName === '部门审核')!
  const node2c2 = nodes.find((n) => n.contractId === contract2.id && n.nodeName === '技术评审')!
  const node3c3 = nodes.find((n) => n.contractId === contract3.id && n.nodeName === '总经理审批')!
  const node2c5 = nodes.find((n) => n.contractId === contract5.id && n.nodeName === '法务评审')!

  await prisma.reminderRecord.createMany({
    data: [
      {
        contractId: contract1.id,
        nodeId: node1c1.id,
        remindType: 'SYSTEM',
        remindContent: '您的审批节点即将超时，请尽快处理',
        remindBy: 'SYSTEM',
        remindTo: '张主管',
        replyStatus: 'PENDING',
      },
      {
        contractId: contract1.id,
        nodeId: node1c1.id,
        remindType: 'SMS',
        remindContent: '合同CT-2026-001部门审核节点已接近超时',
        remindBy: 'SYSTEM',
        remindTo: '张主管',
        replyStatus: 'REPLIED',
      },
      {
        contractId: contract2.id,
        nodeId: node2c2.id,
        remindType: 'EMAIL',
        remindContent: '技术评审节点即将超时，请及时处理',
        remindBy: 'SYSTEM',
        remindTo: '陈工',
        replyStatus: 'PENDING',
      },
      {
        contractId: contract3.id,
        nodeId: node3c3.id,
        remindType: 'SYSTEM',
        remindContent: '总经理审批节点即将超时',
        remindBy: 'SYSTEM',
        remindTo: '王总',
        replyStatus: 'IGNORED',
      },
      {
        contractId: contract5.id,
        nodeId: node2c5.id,
        remindType: 'SMS',
        remindContent: '法务评审节点已超时，请尽快处理',
        remindBy: 'SYSTEM',
        remindTo: '蒋律师',
        replyStatus: 'PENDING',
      },
      {
        contractId: contract5.id,
        nodeId: node2c5.id,
        remindType: 'EMAIL',
        remindContent: '法务评审节点已超时',
        remindBy: 'SYSTEM',
        remindTo: '蒋律师',
        replyStatus: 'REPLIED',
      },
    ],
  })

  await prisma.materialItem.createMany({
    data: [
      {
        contractId: contract1.id,
        materialName: '采购清单',
        status: 'SUBMITTED',
        requiredBy: '张三',
        submittedAt: new Date(now.getTime() - 30 * 60000),
        expectedAt: new Date(now.getTime() + 60 * 60000),
      },
      {
        contractId: contract1.id,
        materialName: '供应商资质证明',
        status: 'MISSING',
        requiredBy: '李会计',
        expectedAt: new Date(now.getTime() + 120 * 60000),
      },
      {
        contractId: contract1.id,
        materialName: '预算审批单',
        status: 'SUPPLEMENTING',
        requiredBy: '张三',
        expectedAt: new Date(now.getTime() + 60 * 60000),
      },
      {
        contractId: contract2.id,
        materialName: '需求规格说明书',
        status: 'SUBMITTED',
        requiredBy: '李四',
        submittedAt: new Date(now.getTime() - 200 * 60000),
        expectedAt: new Date(now.getTime() - 100 * 60000),
      },
      {
        contractId: contract2.id,
        materialName: '技术方案文档',
        status: 'MISSING',
        requiredBy: '陈工',
        expectedAt: new Date(now.getTime() + 180 * 60000),
      },
      {
        contractId: contract2.id,
        materialName: '报价单',
        status: 'SUBMITTED',
        requiredBy: '刘主管',
        submittedAt: new Date(now.getTime() - 150 * 60000),
        expectedAt: new Date(now.getTime() - 80 * 60000),
      },
      {
        contractId: contract2.id,
        materialName: '服务等级协议',
        status: 'MISSING',
        requiredBy: '李四',
        expectedAt: new Date(now.getTime() + 240 * 60000),
      },
      {
        contractId: contract3.id,
        materialName: '物业服务合同正本',
        status: 'SUBMITTED',
        requiredBy: '赵六',
        submittedAt: new Date(now.getTime() - 300 * 60000),
        expectedAt: new Date(now.getTime() - 200 * 60000),
      },
      {
        contractId: contract3.id,
        materialName: '物业资质证书',
        status: 'SUBMITTED',
        requiredBy: '钱主管',
        submittedAt: new Date(now.getTime() - 250 * 60000),
        expectedAt: new Date(now.getTime() - 150 * 60000),
      },
      {
        contractId: contract3.id,
        materialName: '服务验收报告',
        status: 'SUPPLEMENTING',
        requiredBy: '赵六',
        expectedAt: new Date(now.getTime() + 30 * 60000),
      },
      {
        contractId: contract4.id,
        materialName: '推广方案',
        status: 'SUBMITTED',
        requiredBy: '孙七',
        submittedAt: new Date(now.getTime() - 600 * 60000),
        expectedAt: new Date(now.getTime() - 500 * 60000),
      },
      {
        contractId: contract4.id,
        materialName: '合作协议正本',
        status: 'SUBMITTED',
        requiredBy: '冯主管',
        submittedAt: new Date(now.getTime() - 550 * 60000),
        expectedAt: new Date(now.getTime() - 450 * 60000),
      },
      {
        contractId: contract4.id,
        materialName: '付款凭证',
        status: 'SUBMITTED',
        requiredBy: '褚会计',
        submittedAt: new Date(now.getTime() - 400 * 60000),
        expectedAt: new Date(now.getTime() - 350 * 60000),
      },
      {
        contractId: contract5.id,
        materialName: '法律意见书',
        status: 'MISSING',
        requiredBy: '蒋律师',
        expectedAt: new Date(now.getTime() + 60 * 60000),
      },
      {
        contractId: contract5.id,
        materialName: '合同审查报告',
        status: 'SUBMITTED',
        requiredBy: '卫主管',
        submittedAt: new Date(now.getTime() - 280 * 60000),
        expectedAt: new Date(now.getTime() - 200 * 60000),
      },
      {
        contractId: contract5.id,
        materialName: '风险告知书',
        status: 'MISSING',
        requiredBy: '周八',
        expectedAt: new Date(now.getTime() + 120 * 60000),
      },
    ],
  })

  console.log('Seed data created successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
