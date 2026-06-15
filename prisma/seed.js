import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Start seeding...')

  const hashedPassword = bcrypt.hashSync('123456', 10)

  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: hashedPassword,
      name: '系统管理员',
      role: 'ADMIN',
      phone: '13800000001',
      email: 'admin@park.com'
    }
  })

  const operator = await prisma.user.upsert({
    where: { username: 'operator' },
    update: {},
    create: {
      username: 'operator',
      password: hashedPassword,
      name: '运营专员',
      role: 'OPERATOR',
      phone: '13800000002',
      email: 'operator@park.com'
    }
  })

  const engineer = await prisma.user.upsert({
    where: { username: 'engineer' },
    update: {},
    create: {
      username: 'engineer',
      password: hashedPassword,
      name: '张工程师',
      role: 'ENGINEER',
      phone: '13800000003',
      email: 'engineer@park.com'
    }
  })

  const engineer2 = await prisma.user.upsert({
    where: { username: 'engineer2' },
    update: {},
    create: {
      username: 'engineer2',
      password: hashedPassword,
      name: '李工程师',
      role: 'ENGINEER',
      phone: '13800000004',
      email: 'engineer2@park.com'
    }
  })

  const tenant1 = await prisma.tenant.upsert({
    where: { name: '科技有限公司' },
    update: {},
    create: {
      name: '科技有限公司',
      contactName: '王总',
      contactPhone: '13900000001',
      address: 'A座',
      floor: '5层',
      roomNumber: '501',
      businessType: '互联网科技',
      status: 'active'
    }
  })

  const tenant2 = await prisma.tenant.upsert({
    where: { name: '贸易发展公司' },
    update: {},
    create: {
      name: '贸易发展公司',
      contactName: '李总',
      contactPhone: '13900000002',
      address: 'A座',
      floor: '8层',
      roomNumber: '801',
      businessType: '进出口贸易',
      status: 'active'
    }
  })

  const tenant3 = await prisma.tenant.upsert({
    where: { name: '创意设计工作室' },
    update: {},
    create: {
      name: '创意设计工作室',
      contactName: '张总',
      contactPhone: '13900000003',
      address: 'B座',
      floor: '3层',
      roomNumber: '302',
      businessType: '创意设计',
      status: 'active'
    }
  })

  const tenantUser1 = await prisma.user.upsert({
    where: { username: 'tenant1' },
    update: {},
    create: {
      username: 'tenant1',
      password: hashedPassword,
      name: '王经理',
      role: 'TENANT',
      tenantId: tenant1.id,
      phone: '13900000011',
      email: 'wang@tech.com'
    }
  })

  const tenantUser2 = await prisma.user.upsert({
    where: { username: 'tenant2' },
    update: {},
    create: {
      username: 'tenant2',
      password: hashedPassword,
      name: '李助理',
      role: 'TENANT',
      tenantId: tenant2.id,
      phone: '13900000022',
      email: 'li@trade.com'
    }
  })

  const tenantUser3 = await prisma.user.upsert({
    where: { username: 'tenant3' },
    update: {},
    create: {
      username: 'tenant3',
      password: hashedPassword,
      name: '张设计',
      role: 'TENANT',
      tenantId: tenant3.id,
      phone: '13900000033',
      email: 'zhang@design.com'
    }
  })

  const now = new Date()

  const workOrder1 = await prisma.workOrder.upsert({
    where: { orderNo: 'WO202406150001' },
    update: {},
    create: {
      orderNo: 'WO202406150001',
      title: '空调不制冷维修',
      description: '办公室中央空调不制冷，室内温度28度以上，影响员工办公。',
      type: 'REPAIR',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      creatorId: tenantUser1.id,
      tenantId: tenant1.id,
      location: 'A座5层501室',
      contactName: '王经理',
      contactPhone: '13900000011',
      deadline: new Date(now.getTime() + 4 * 60 * 60 * 1000),
      actualStart: new Date(now.getTime() - 30 * 60 * 1000)
    }
  })

  const workOrder2 = await prisma.workOrder.upsert({
    where: { orderNo: 'WO202406150002' },
    update: {},
    create: {
      orderNo: 'WO202406150002',
      title: '打印机安装',
      description: '新采购的网络打印机需要安装调试，并连接到办公网络。',
      type: 'INSTALLATION',
      status: 'PENDING',
      priority: 'MEDIUM',
      creatorId: tenantUser2.id,
      tenantId: tenant2.id,
      location: 'A座8层801室',
      contactName: '李助理',
      contactPhone: '13900000022',
      deadline: new Date(now.getTime() + 24 * 60 * 60 * 1000)
    }
  })

  const workOrder3 = await prisma.workOrder.upsert({
    where: { orderNo: 'WO202406150003' },
    update: {},
    create: {
      orderNo: 'WO202406150003',
      title: '门锁故障维修',
      description: '办公室玻璃门电子锁故障，无法正常开关，存在安全隐患。',
      type: 'REPAIR',
      status: 'COMPLETED',
      priority: 'URGENT',
      creatorId: tenantUser3.id,
      tenantId: tenant3.id,
      location: 'B座3层302室',
      contactName: '张设计',
      contactPhone: '13900000033',
      actualStart: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
      actualEnd: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000)
    }
  })

  await prisma.workOrderAssignment.upsert({
    where: { id: 1 },
    update: {},
    create: {
      workOrderId: workOrder1.id,
      assigneeId: engineer.id,
      status: 'ACCEPTED',
      acceptedAt: new Date(now.getTime() - 25 * 60 * 1000),
      remark: '已安排维修，需要检查压缩机'
    }
  })

  await prisma.workOrderAssignment.upsert({
    where: { id: 2 },
    update: {},
    create: {
      workOrderId: workOrder3.id,
      assigneeId: engineer2.id,
      status: 'COMPLETED',
      acceptedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000),
      completedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      remark: '门锁已修复'
    }
  })

  await prisma.workOrderProgress.upsert({
    where: { id: 1 },
    update: {},
    create: {
      workOrderId: workOrder1.id,
      status: '已接单',
      description: '工程师已接单，正在准备维修工具',
      operatorId: engineer.id,
      operatorName: '张工程师',
      progressPercent: 20
    }
  })

  await prisma.workOrderProgress.upsert({
    where: { id: 2 },
    update: {},
    create: {
      workOrderId: workOrder1.id,
      status: '现场检查',
      description: '已到达现场，检查发现制冷剂不足，需要补充',
      operatorId: engineer.id,
      operatorName: '张工程师',
      progressPercent: 50
    }
  })

  await prisma.workOrderProgress.upsert({
    where: { id: 3 },
    update: {},
    create: {
      workOrderId: workOrder3.id,
      status: '已完成',
      description: '门锁电路板已更换，功能恢复正常',
      operatorId: engineer2.id,
      operatorName: '李工程师',
      progressPercent: 100
    }
  })

  await prisma.workOrderMaterial.upsert({
    where: { id: 1 },
    update: {},
    create: {
      workOrderId: workOrder1.id,
      name: 'R22制冷剂',
      specification: '10kg/瓶',
      quantity: 1,
      unit: '瓶',
      unitPrice: 350,
      totalPrice: 350,
      operatorId: engineer.id
    }
  })

  await prisma.workOrderMaterial.upsert({
    where: { id: 2 },
    update: {},
    create: {
      workOrderId: workOrder3.id,
      name: '电子锁控制板',
      specification: 'AC-200',
      quantity: 1,
      unit: '个',
      unitPrice: 280,
      totalPrice: 280,
      operatorId: engineer2.id
    }
  })

  await prisma.workOrderCost.upsert({
    where: { id: 1 },
    update: {},
    create: {
      workOrderId: workOrder3.id,
      materialCost: 280,
      laborCost: 150,
      totalCost: 430,
      costDetails: '电子锁控制板 280元 + 人工费 150元',
      operatorId: operator.id,
      confirmedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000)
    }
  })

  await prisma.workOrderReview.upsert({
    where: { id: 1 },
    update: {},
    create: {
      workOrderId: workOrder3.id,
      reviewerId: operator.id,
      result: '合格',
      content: '维修质量良好，门锁功能正常，租户反馈满意',
      suggestion: '建议定期检查门锁电池'
    }
  })

  await prisma.satisfactionSurvey.upsert({
    where: { id: 1 },
    update: {},
    create: {
      workOrderId: workOrder3.id,
      tenantId: tenant3.id,
      respondentId: tenantUser3.id,
      overallScore: 5,
      responseSpeed: 5,
      serviceAttitude: 5,
      repairQuality: 4,
      costReasonable: 5,
      comment: '维修速度很快，工程师很专业',
      improvement: '希望费用可以更透明一些',
      sourceType: 'WORK_ORDER'
    }
  })

  await prisma.inspectionTask.upsert({
    where: { taskNo: 'INSP202406150001' },
    update: {},
    create: {
      taskNo: 'INSP202406150001',
      title: 'A座月度消防检查',
      description: '检查A座各楼层消防设施，包括灭火器、喷淋系统、应急照明等',
      type: '消防检查',
      status: 'PENDING',
      location: 'A座各楼层',
      assigneeId: engineer.id,
      planDate: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
      items: JSON.stringify(['灭火器压力', '喷淋管道', '应急照明', '疏散通道', '消防栓'])
    }
  })

  await prisma.inspectionTask.upsert({
    where: { taskNo: 'INSP202406150002' },
    update: {},
    create: {
      taskNo: 'INSP202406150002',
      title: 'B座电梯例行检查',
      description: 'B座2部电梯月度安全检查',
      type: '电梯检查',
      status: 'COMPLETED',
      location: 'B座电梯机房及轿厢',
      assigneeId: engineer2.id,
      planDate: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      actualDate: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
      result: '合格',
      items: JSON.stringify(['曳引机', '控制系统', '门机系统', '安全装置', '应急通话'])
    }
  })

  const visitor1 = await prisma.visitorAppointment.upsert({
    where: { visitNo: 'VIS202406150001' },
    update: {},
    create: {
      visitNo: 'VIS202406150001',
      visitorName: '陈经理',
      visitorPhone: '13700000001',
      visitorCompany: '供应商公司',
      visitDate: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000),
      visitEndDate: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000),
      purpose: '业务洽谈',
      status: 'PENDING',
      tenantId: tenant1.id,
      hostName: '王经理',
      hostPhone: '13900000011',
      creatorId: tenantUser1.id
    }
  })

  const visitor2 = await prisma.visitorAppointment.upsert({
    where: { visitNo: 'VIS202406150002' },
    update: {},
    create: {
      visitNo: 'VIS202406150002',
      visitorName: '刘先生',
      visitorPhone: '13700000002',
      visitorIdCard: '110101199001011234',
      visitorCompany: '某咨询公司',
      visitDate: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
      purpose: '项目咨询',
      status: 'REJECTED',
      tenantId: tenant2.id,
      hostName: '李助理',
      hostPhone: '13900000022',
      creatorId: tenantUser2.id,
      handlerId: operator.id,
      rejectReason: '访客身份信息与预约信息不符，且未能提供有效证明文件'
    }
  })

  await prisma.auditException.upsert({
    where: { id: 1 },
    update: {},
    create: {
      sourceType: 'VISITOR',
      sourceId: visitor2.id,
      title: '访客审核失败-身份信息不符',
      detail: '访客刘先生预约时填写的身份证号为110101199001011234，但现场出示的身份证号为110101199002025678，姓名虽然一致但身份证号不匹配。访客称是预约时填写错误，但无法提供其他有效身份证明。',
      impactScope: '1. 涉及租户：贸易发展公司（A座8层801室）\n2. 涉及人员：租户接待人李助理、访客刘先生\n3. 安全影响：存在身份冒用风险，可能对租户及园区安全造成隐患\n4. 业务影响：租户正常商务接待受影响',
      impactLevel: 'HIGH',
      processOrder: 1,
      suggestion: '1. 首先联系租户接待人李助理，核实本次访客预约的真实性和必要性\n2. 如确认是预约填写错误，要求访客重新提交正确的身份信息后再次审核\n3. 如无法核实访客身份，建议拒绝本次访问并提醒租户加强预约信息管理\n4. 将此次异常记录到该租户的信用档案中\n5. 对该访客进行标记，后续预约需加强审核',
      createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000)
    }
  })

  await prisma.auditException.upsert({
    where: { id: 2 },
    update: {},
    create: {
      sourceType: 'VISITOR',
      sourceId: visitor2.id,
      title: '访客审核失败-缺少企业资质证明',
      detail: '访客刘先生所在的"某咨询公司"未能在园区备案，且访客无法提供该公司的营业执照或介绍信等资质证明文件。根据园区规定，外来企业人员访问需要提供企业资质证明。',
      impactScope: '1. 涉及租户：贸易发展公司\n2. 涉及访客企业：某咨询公司\n3. 管理影响：违反园区访客管理规定第3条\n4. 租户影响：可能影响租户与合作方的商务往来',
      impactLevel: 'MEDIUM',
      processOrder: 2,
      suggestion: '1. 告知租户关于外来企业人员访问的资质要求\n2. 建议访客企业提供营业执照电子版进行备案\n3. 如为首次合作，可由租户出具担保函后临时放行\n4. 将该企业加入待备案列表，待后续完善资料',
      createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000 + 35 * 60 * 1000)
    }
  })

  await prisma.engineeringRepair.upsert({
    where: { repairNo: 'ENG202406150001' },
    update: {},
    create: {
      repairNo: 'ENG202406150001',
      title: 'B座卫生间漏水维修',
      description: 'B座3层男卫生间天花板漏水，需要检查防水和管道',
      type: '给排水维修',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      location: 'B座3层卫生间',
      creatorId: operator.id,
      handlerId: engineer.id,
      planDate: new Date(now.getTime() + 2 * 60 * 60 * 1000)
    }
  })

  await prisma.engineeringRepair.upsert({
    where: { repairNo: 'ENG202406150002' },
    update: {},
    create: {
      repairNo: 'ENG202406150002',
      title: '停车场照明系统改造',
      description: 'B1层停车场部分区域照明不足，需要新增LED灯具',
      type: '电气维修',
      status: 'PENDING',
      priority: 'MEDIUM',
      location: 'B1层停车场西区',
      creatorId: operator.id,
      cost: 5000
    }
  })

  await prisma.filterPreset.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: '待处理工单',
      userId: operator.id,
      pageKey: 'workorder-list',
      filters: JSON.stringify({ status: ['PENDING', 'ASSIGNED', 'IN_PROGRESS'] }),
      sortBy: 'createdAt',
      sortOrder: 'desc',
      isDefault: true
    }
  })

  await prisma.filterPreset.upsert({
    where: { id: 2 },
    update: {},
    create: {
      name: '今日待处理',
      userId: operator.id,
      pageKey: 'workorder-list',
      filters: JSON.stringify({
        status: ['PENDING', 'ASSIGNED', 'IN_PROGRESS'],
        dateRange: 'today'
      }),
      sortBy: 'priority',
      sortOrder: 'desc'
    }
  })

  await prisma.filterPreset.upsert({
    where: { id: 3 },
    update: {},
    create: {
      name: '我的工单',
      userId: tenantUser1.id,
      pageKey: 'workorder-list',
      filters: JSON.stringify({ mine: true }),
      sortBy: 'createdAt',
      sortOrder: 'desc',
      isDefault: true
    }
  })

  console.log('Seeding completed!')
  console.log('Created users:')
  console.log('  - admin / 123456 (系统管理员)')
  console.log('  - operator / 123456 (运营专员)')
  console.log('  - engineer / 123456 (张工程师)')
  console.log('  - engineer2 / 123456 (李工程师)')
  console.log('  - tenant1 / 123456 (科技有限公司-王经理)')
  console.log('  - tenant2 / 123456 (贸易发展公司-李助理)')
  console.log('  - tenant3 / 123456 (创意设计工作室-张设计)')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
