import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('开始播种数据...')

  const hashedPassword = await bcrypt.hash('123456', 10)

  const users = await prisma.user.createMany({
    data: [
      { name: '王先生', phone: '13800138001', role: 'owner', passwordHash: hashedPassword, email: 'wang@example.com' },
      { name: '李经理', phone: '13800138002', role: 'manager', passwordHash: hashedPassword, email: 'li@example.com' },
      { name: '张巡检', phone: '13800138003', role: 'inspector', passwordHash: hashedPassword, email: 'zhang@example.com' },
      { name: '李巡检', phone: '13800138004', role: 'inspector', passwordHash: hashedPassword, email: 'lixj@example.com' },
      { name: '赵客服', phone: '13800138005', role: 'customer_service', passwordHash: hashedPassword, email: 'zhao@example.com' },
    ],
    skipDuplicates: true,
  })

  console.log(`创建了 ${users.count} 个用户`)

  const owner = await prisma.user.findFirst({ where: { role: 'owner' } })
  const manager = await prisma.user.findFirst({ where: { role: 'manager' } })
  const inspector = await prisma.user.findFirst({ where: { role: 'inspector' } })
  const customerService = await prisma.user.findFirst({ where: { role: 'customer_service' } })

  if (!owner || !manager || !inspector || !customerService) {
    console.error('用户数据不完整')
    return
  }

  const projects = await prisma.project.createMany({
    data: [
      {
        name: '万科城一期A栋',
        ownerId: owner.id,
        status: 'in_progress',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-06-30'),
        description: '精装修工程',
      },
      {
        name: '碧桂园二期B栋',
        ownerId: owner.id,
        status: 'in_progress',
        startDate: new Date('2024-01-10'),
        endDate: new Date('2024-07-15'),
        description: '简装工程',
      },
      {
        name: '恒大名都3号楼',
        ownerId: owner.id,
        status: 'quoting',
        startDate: null,
        endDate: null,
        description: '豪装工程',
      },
      {
        name: '融创滨江壹号',
        ownerId: owner.id,
        status: 'completed',
        startDate: new Date('2023-06-01'),
        endDate: new Date('2023-12-31'),
        description: '中装修工程',
      },
      {
        name: '保利天汇C区',
        ownerId: owner.id,
        status: 'in_progress',
        startDate: new Date('2024-01-05'),
        endDate: new Date('2024-06-20'),
        description: '旧房改造',
      },
    ],
    skipDuplicates: true,
  })

  console.log(`创建了 ${projects.count} 个项目`)

  const project1 = await prisma.project.findFirst({ where: { name: '万科城一期A栋' } })
  const project2 = await prisma.project.findFirst({ where: { name: '碧桂园二期B栋' } })

  if (project1) {
    const budgetVersion1 = await prisma.budgetVersion.create({
      data: {
        projectId: project1.id,
        version: 1,
        totalAmount: 265000,
        changeAmount: 0,
        status: 'confirmed',
        confirmedAt: new Date('2024-01-01'),
        confirmedBy: owner.id,
        createdBy: manager.id,
      },
    })

    const budgetVersion2 = await prisma.budgetVersion.create({
      data: {
        projectId: project1.id,
        version: 2,
        totalAmount: 270000,
        changeAmount: 5000,
        changeReason: '材料升级',
        status: 'confirmed',
        confirmedAt: new Date('2024-01-05'),
        confirmedBy: owner.id,
        createdBy: manager.id,
      },
    })

    const budgetVersion3 = await prisma.budgetVersion.create({
      data: {
        projectId: project1.id,
        version: 3,
        totalAmount: 285000,
        changeAmount: 15000,
        changeReason: '增加水电改造工程量及材料升级',
        status: 'confirmed',
        confirmedAt: new Date('2024-01-15'),
        confirmedBy: owner.id,
        createdBy: manager.id,
      },
    })

    await prisma.budgetItem.createMany({
      data: [
        { budgetVersionId: budgetVersion3.id, name: '水电改造', category: '基础工程', unit: '项', quantity: 1, unitPrice: 35000, amount: 35000, remark: '含强弱电、给排水' },
        { budgetVersionId: budgetVersion3.id, name: '瓦工工程', category: '泥工', unit: '㎡', quantity: 120, unitPrice: 280, amount: 33600, remark: '含墙地砖铺贴' },
        { budgetVersionId: budgetVersion3.id, name: '木工工程', category: '木工', unit: '项', quantity: 1, unitPrice: 45000, amount: 45000, remark: '吊顶、柜体基层' },
        { budgetVersionId: budgetVersion3.id, name: '油漆工程', category: '油漆', unit: '㎡', quantity: 300, unitPrice: 85, amount: 25500, remark: '墙面腻子乳胶漆' },
        { budgetVersionId: budgetVersion3.id, name: '主材费用', category: '主材', unit: '项', quantity: 1, unitPrice: 120000, amount: 120000, remark: '瓷砖、地板、橱柜等' },
        { budgetVersionId: budgetVersion3.id, name: '管理费用', category: '其他', unit: '项', quantity: 1, unitPrice: 26400, amount: 26400, remark: '项目管理费' },
      ],
    })

    await prisma.project.update({
      where: { id: project1.id },
      data: { currentBudgetVersionId: budgetVersion3.id },
    })

    console.log('创建了预算版本数据')

    const inspection1 = await prisma.inspection.create({
      data: {
        projectId: project1.id,
        title: '水电工程验收',
        inspectorId: inspector.id,
        status: 'completed',
        scheduledAt: new Date('2024-01-20T10:00:00'),
        completedAt: new Date('2024-01-20T16:00:00'),
        budgetVersionId: budgetVersion3.id,
        remark: '重点检查水电管线走向和防水工程',
      },
    })

    const inspection2 = await prisma.inspection.create({
      data: {
        projectId: project1.id,
        title: '瓦工阶段巡检',
        inspectorId: inspector.id,
        status: 'rectifying',
        scheduledAt: new Date('2024-02-05T09:00:00'),
        budgetVersionId: budgetVersion3.id,
      },
    })

    await prisma.inspectionPhoto.createMany({
      data: [
        { inspectionId: inspection1.id, url: '/photos/ins1-1.jpg', category: '水电', description: '客厅电路布线' },
        { inspectionId: inspection1.id, url: '/photos/ins1-2.jpg', category: '水电', description: '卫生间水管' },
        { inspectionId: inspection1.id, url: '/photos/ins1-3.jpg', category: '防水', description: '厨房防水' },
        { inspectionId: inspection1.id, url: '/photos/ins1-4.jpg', category: '水电', description: '配电箱' },
      ],
    })

    await prisma.rectification.createMany({
      data: [
        { inspectionId: inspection1.id, title: '卫生间防水高度不足', description: '淋浴区防水高度只有1.5米，规范要求1.8米，需要补做', responsiblePerson: '李工', deadline: new Date('2024-01-25'), status: 'completed', completedAt: new Date('2024-01-24T16:00:00') },
        { inspectionId: inspection2.id, title: '墙面平整度超标', description: '主卧墙面平整度偏差5mm', responsiblePerson: '王工', deadline: new Date('2024-02-10'), status: 'pending' },
        { inspectionId: inspection2.id, title: '地砖空鼓', description: '客厅有3块地砖空鼓', responsiblePerson: '王工', deadline: new Date('2024-02-08'), status: 'processing' },
      ],
    })

    await prisma.inspectionFeedback.create({
      data: {
        inspectionId: inspection1.id,
        conclusion: 'pass_with_rectification',
        remark: '整体合格，防水问题已整改完成',
        confirmedBy: owner.id,
        confirmedAt: new Date('2024-01-22T14:00:00'),
      },
    })

    console.log('创建了巡检数据')

    await prisma.notification.createMany({
      data: [
        { userId: owner.id, type: 'budget_change', title: '预算版本已更新', content: '万科城一期A栋预算已更新至第3版，请确认。', relatedId: budgetVersion3.id },
        { userId: manager.id, type: 'delay_warning', title: '项目延期预警', content: '万科城一期A栋可能存在延期风险，请关注。', relatedId: project1.id },
        { userId: inspector.id, type: 'inspection_assigned', title: '新的巡检任务', content: '您被分派了万科城一期A栋的瓦工阶段巡检任务。', relatedId: inspection2.id },
      ],
    })

    console.log('创建了通知数据')
  }

  console.log('数据播种完成！')
  console.log('演示账号：')
  console.log('  业主：13800138001 / 123456')
  console.log('  项目经理：13800138002 / 123456')
  console.log('  巡检员：13800138003 / 123456')
  console.log('  客服：13800138005 / 123456')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
