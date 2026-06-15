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

  const inspection1 = await prisma.inspectionTask.upsert({
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

  const inspection2 = await prisma.inspectionTask.upsert({
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

  // 额外巡检任务用于满意度关联（不冲突）
  const inspection3 = await prisma.inspectionTask.upsert({
    where: { taskNo: 'INSP202406140003' },
    update: {},
    create: {
      taskNo: 'INSP202406140003',
      title: 'A座消防设施季度巡检',
      description: 'A座各楼层消防设施全面检查',
      type: '消防检查',
      status: 'COMPLETED',
      location: 'A座各楼层',
      assigneeId: engineer.id,
      planDate: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000),
      actualDate: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000),
      result: '合格',
      items: JSON.stringify(['灭火器', '喷淋系统', '应急照明', '疏散通道', '消防栓'])
    }
  })

  const inspection4 = await prisma.inspectionTask.upsert({
    where: { taskNo: 'INSP202406130004' },
    update: {},
    create: {
      taskNo: 'INSP202406130004',
      title: 'B座配电室安全检查',
      description: 'B座配电室设备安全运行检查',
      type: '电气检查',
      status: 'COMPLETED',
      location: 'B座配电室',
      assigneeId: engineer2.id,
      planDate: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
      actualDate: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
      result: '合格',
      items: JSON.stringify(['变压器', '配电柜', '接地系统', '消防器材'])
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
    where: { exceptionNo: 'EXC202406150001' },
    update: {},
    create: {
      exceptionNo: 'EXC202406150001',
      type: 'VISITOR_REJECT',
      sourceType: 'VISITOR',
      sourceId: visitor2.id,
      relatedNo: visitor2.visitNo,
      title: '访客审核失败-身份信息不符',
      detail: '访客刘先生预约时填写的身份证号为110101199001011234，但现场出示的身份证号为110101199002025678，姓名虽然一致但身份证号不匹配。访客称是预约时填写错误，但无法提供其他有效身份证明。',
      status: 'PENDING',
      priority: 'HIGH',
      impactScope: JSON.stringify({
        direct: [
          '访客刘先生本人无法进入园区',
          '当日已安排的商务洽谈会面计划作废'
        ],
        indirect: [
          '被访租户贸易发展公司接待计划受阻',
          '可能影响租户与咨询公司的项目合作洽谈',
          '租户方内部协调成本增加，需重新安排会议'
        ],
        related: [
          '前台登记流程需调整该访客登记状态',
          '安保检查系统需更新访客白名单信息',
          '园区访客信用档案需记录本次异常'
        ]
      }),
      impactLevel: 'HIGH',
      processOrder: JSON.stringify([
        { step: 1, action: '通知被访租户', description: '第一时间联系被访租户接待人李助理，告知访客预约被拒情况，协商是否需要重新预约或其他安排', responsible: '前台接待', status: 'PENDING' },
        { step: 2, action: '联系访客说明原因', description: '向访客详细说明拒绝原因，提供后续申请的指导和建议，保持礼貌与专业态度', responsible: '运营人员', status: 'PENDING' },
        { step: 3, action: '核实身份信息', description: '如访客声称填写错误，可协助核对正确身份信息，确认后启动重新审核流程', responsible: '运营人员', status: 'PENDING' },
        { step: 4, action: '更新系统记录', description: '确保异常记录完整，包括原因、影响范围和处理措施，同步至租户服务档案与访客信用档案', responsible: '运营人员', status: 'PENDING' },
        { step: 5, action: '跟进后续处理', description: '如访客需要重新申请提供协助；如租户有异议进行协调处理；涉及重要访客立即通知主管', responsible: '运营主管', status: 'PENDING' }
      ]),
      suggestion: '请联系租户核实情况，如访客确实是预约填写错误，可指导其补充正确身份信息后重新提交预约。若涉及重要商务访客，可由租户出具担保函后安排临时访问。本次异常需记录到租户信用档案，后续加强该租户预约信息审核。',
      creatorId: operator.id,
      createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000)
    }
  })

  await prisma.auditException.upsert({
    where: { exceptionNo: 'EXC202406150002' },
    update: {},
    create: {
      exceptionNo: 'EXC202406150002',
      type: 'VISITOR_REJECT',
      sourceType: 'VISITOR',
      sourceId: visitor2.id,
      relatedNo: visitor2.visitNo,
      title: '访客审核失败-缺少企业资质证明',
      detail: '访客刘先生所在的"某咨询公司"未能在园区备案，且访客无法提供该公司的营业执照或介绍信等资质证明文件。根据园区规定，外来企业人员访问需要提供企业资质证明。',
      status: 'ASSIGNED',
      priority: 'MEDIUM',
      handlerId: engineer.id,
      impactScope: JSON.stringify({
        direct: [
          '咨询公司人员无法进入园区开展业务',
          '当日项目咨询会面无法正常进行'
        ],
        indirect: [
          '贸易发展公司与咨询公司的项目合作进度可能延误',
          '租户对园区服务满意度可能受到影响',
          '需重新协调双方时间安排，增加沟通成本'
        ],
        related: [
          '园区访客管理规定需向租户加强宣导',
          '企业备案流程可优化，提供线上备案通道',
          '租户服务专员需跟进租户后续需求'
        ]
      }),
      impactLevel: 'MEDIUM',
      processOrder: JSON.stringify([
        { step: 1, action: '告知资质要求', description: '向租户和访客说明园区关于外来企业人员访问的资质要求和相关规定', responsible: '前台接待', status: 'DONE' },
        { step: 2, action: '指导企业备案', description: '指导访客企业准备营业执照等资料，完成园区企业备案流程', responsible: '运营人员', status: 'IN_PROGRESS' },
        { step: 3, action: '提供临时方案', description: '如为首次合作且情况紧急，可由租户出具担保函后安排临时放行', responsible: '运营主管', status: 'PENDING' },
        { step: 4, action: '跟进访客重新预约', description: '待企业备案完成后，跟进访客重新提交预约申请并优先审核', responsible: '运营人员', status: 'PENDING' },
        { step: 5, action: '复盘优化流程', description: '将该企业加入待备案列表，评估是否需要优化企业备案和访客审核流程', responsible: '管理员', status: 'PENDING' }
      ]),
      suggestion: '告知租户关于外来企业人员访问的资质要求，建议访客企业提供营业执照电子版进行线上备案。如为首次紧急合作，可由租户出具担保函后临时放行。建议定期向租户宣导园区访客管理规定，减少类似情况发生。',
      creatorId: operator.id,
      handledAt: new Date(now.getTime() - 20 * 60 * 60 * 1000),
      createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000 + 35 * 60 * 1000)
    }
  })

  const engRepair1 = await prisma.engineeringRepair.upsert({
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

  const engRepair2 = await prisma.engineeringRepair.upsert({
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

  // 增加一个已完成的工程报修用于满意度
  const engRepair3 = await prisma.engineeringRepair.upsert({
    where: { repairNo: 'ENG202406140003' },
    update: {},
    create: {
      repairNo: 'ENG202406140003',
      title: 'A座空调主机保养',
      description: 'A座中央空调主机季度保养维护',
      type: '暖通维修',
      status: 'COMPLETED',
      priority: 'MEDIUM',
      location: 'A座屋顶机房',
      creatorId: operator.id,
      handlerId: engineer.id,
      planDate: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
      actualCost: 1200,
      maintenanceHours: 4,
      result: '已完成'
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

  // ============ 满意度调查数据 ============
  // 工单相关满意度
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
      comment: '维修速度很快，工程师很专业，门锁问题很快就解决了',
      improvement: '希望费用可以更透明一些，能提前有报价就更好了',
      sourceType: 'WORK_ORDER',
      surveyDate: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000)
    }
  })

  await prisma.satisfactionSurvey.upsert({
    where: { id: 2 },
    update: {},
    create: {
      workOrderId: workOrder1.id,
      tenantId: tenant1.id,
      respondentId: tenantUser1.id,
      overallScore: 4,
      responseSpeed: 5,
      serviceAttitude: 4,
      repairQuality: 4,
      costReasonable: 3,
      comment: '响应速度很快，工程师服务态度也不错，空调问题正在处理中',
      improvement: '感觉材料费用有点高，希望能有更多的费用明细说明',
      sourceType: 'WORK_ORDER',
      surveyDate: new Date(now.getTime() - 2 * 60 * 60 * 1000)
    }
  })

  await prisma.satisfactionSurvey.upsert({
    where: { id: 3 },
    update: {},
    create: {
      workOrderId: workOrder2.id,
      tenantId: tenant2.id,
      respondentId: tenantUser2.id,
      overallScore: 5,
      responseSpeed: 5,
      serviceAttitude: 5,
      repairQuality: 5,
      costReasonable: 4,
      comment: '打印机安装调试完成得很快，工程师还顺便帮我们设置了共享打印，超赞！',
      improvement: '',
      sourceType: 'WORK_ORDER',
      surveyDate: new Date(now.getTime() - 30 * 60 * 1000)
    }
  })

  // 巡检相关满意度
  await prisma.satisfactionSurvey.upsert({
    where: { id: 4 },
    update: {},
    create: {
      inspectionTaskId: inspection2.id,
      tenantId: tenant1.id,
      respondentId: tenantUser1.id,
      overallScore: 5,
      responseSpeed: 4,
      serviceAttitude: 5,
      repairQuality: 5,
      costReasonable: 5,
      comment: '巡检很仔细，发现了几个我们没注意到的安全隐患，非常专业',
      improvement: '建议巡检后能提供更详细的书面报告，方便我们跟进整改',
      sourceType: 'INSPECTION',
      surveyDate: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000)
    }
  })

  await prisma.satisfactionSurvey.upsert({
    where: { id: 5 },
    update: {},
    create: {
      inspectionTaskId: inspection3.id,
      tenantId: tenant2.id,
      respondentId: tenantUser2.id,
      overallScore: 4,
      responseSpeed: 4,
      serviceAttitude: 5,
      repairQuality: 4,
      costReasonable: 4,
      comment: '电梯检查很及时，工程师态度也很好',
      improvement: '',
      sourceType: 'INSPECTION',
      surveyDate: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000)
    }
  })

  await prisma.satisfactionSurvey.upsert({
    where: { id: 9 },
    update: {},
    create: {
      inspectionTaskId: inspection4.id,
      tenantId: tenant3.id,
      respondentId: tenantUser3.id,
      overallScore: 4,
      responseSpeed: 4,
      serviceAttitude: 4,
      repairQuality: 5,
      costReasonable: 4,
      comment: '配电室检查很专业，发现了一个潜在的安全隐患',
      improvement: '',
      sourceType: 'INSPECTION',
      surveyDate: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000)
    }
  })

  // 访客相关满意度
  await prisma.satisfactionSurvey.upsert({
    where: { id: 6 },
    update: {},
    create: {
      visitorAppointmentId: visitor1.id,
      tenantId: tenant1.id,
      respondentId: tenantUser1.id,
      overallScore: 4,
      responseSpeed: 5,
      serviceAttitude: 4,
      repairQuality: 4,
      costReasonable: 5,
      comment: '访客预约流程很方便，前台接待也很热情，访客体验不错',
      improvement: '希望可以支持访客二维码自助签到，减少前台排队时间',
      sourceType: 'VISITOR',
      surveyDate: new Date(now.getTime() - 12 * 60 * 60 * 1000)
    }
  })

  // 工程报修相关满意度
  await prisma.satisfactionSurvey.upsert({
    where: { id: 7 },
    update: {},
    create: {
      engineeringRepairId: engRepair3.id,
      tenantId: tenant1.id,
      respondentId: tenantUser1.id,
      overallScore: 4,
      responseSpeed: 4,
      serviceAttitude: 5,
      repairQuality: 4,
      costReasonable: 3,
      comment: '空调主机保养做得很专业，价格感觉有点贵',
      improvement: '希望保养套餐能更实惠一些',
      sourceType: 'ENGINEERING',
      surveyDate: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000)
    }
  })

  await prisma.satisfactionSurvey.upsert({
    where: { id: 8 },
    update: {},
    create: {
      engineeringRepairId: engRepair1.id,
      tenantId: tenant3.id,
      respondentId: tenantUser3.id,
      overallScore: 3,
      responseSpeed: 3,
      serviceAttitude: 4,
      repairQuality: 3,
      costReasonable: 2,
      comment: '卫生间漏水问题处理了两次才彻底修好，工程师态度还可以但效率一般',
      improvement: '希望第一次就能把问题彻底解决，反复维修影响正常使用',
      sourceType: 'ENGINEERING',
      surveyDate: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)
    }
  })

  // 历史数据（近 3 个月），用于趋势图展示，分布在各租户各类型
  const historySurveys = [
    { days: 90, tenant: 'tenant1', user: 'tenantUser1', type: 'workorder', score: 4, speed: 4, attitude: 5, quality: 4, cost: 3, comment: '服务挺好的' },
    { days: 82, tenant: 'tenant2', user: 'tenantUser2', type: 'workorder', score: 5, speed: 5, attitude: 5, quality: 5, cost: 4, comment: '非常满意' },
    { days: 75, tenant: 'tenant3', user: 'tenantUser3', type: 'visitor', score: 4, speed: 5, attitude: 4, quality: 4, cost: 5, comment: '访客服务不错' },
    { days: 68, tenant: 'tenant1', user: 'tenantUser1', type: 'inspection', score: 4, speed: 4, attitude: 4, quality: 5, cost: 4, comment: '巡检认真' },
    { days: 60, tenant: 'tenant2', user: 'tenantUser2', type: 'engineering', score: 3, speed: 3, attitude: 4, quality: 3, cost: 3, comment: '一般般' },
    { days: 52, tenant: 'tenant1', user: 'tenantUser1', type: 'workorder', score: 5, speed: 5, attitude: 5, quality: 5, cost: 4, comment: '维修很专业' },
    { days: 45, tenant: 'tenant3', user: 'tenantUser3', type: 'workorder', score: 4, speed: 4, attitude: 5, quality: 4, cost: 4, comment: '' },
    { days: 38, tenant: 'tenant2', user: 'tenantUser2', type: 'visitor', score: 5, speed: 5, attitude: 5, quality: 5, cost: 5, comment: '预约很方便' },
    { days: 30, tenant: 'tenant1', user: 'tenantUser1', type: 'engineering', score: 4, speed: 4, attitude: 4, quality: 4, cost: 3, comment: '' },
    { days: 25, tenant: 'tenant3', user: 'tenantUser3', type: 'inspection', score: 5, speed: 4, attitude: 5, quality: 5, cost: 5, comment: '非常专业' },
    { days: 20, tenant: 'tenant2', user: 'tenantUser2', type: 'workorder', score: 4, speed: 5, attitude: 4, quality: 4, cost: 4, comment: '服务还可以' },
    { days: 15, tenant: 'tenant1', user: 'tenantUser1', type: 'visitor', score: 4, speed: 4, attitude: 5, quality: 4, cost: 4, comment: '' },
    { days: 12, tenant: 'tenant3', user: 'tenantUser3', type: 'workorder', score: 5, speed: 5, attitude: 5, quality: 5, cost: 5, comment: '非常好' },
    { days: 8, tenant: 'tenant2', user: 'tenantUser2', type: 'inspection', score: 4, speed: 3, attitude: 4, quality: 4, cost: 4, comment: '' },
    { days: 5, tenant: 'tenant1', user: 'tenantUser1', type: 'workorder', score: 5, speed: 5, attitude: 5, quality: 5, cost: 4, comment: '响应很快' }
  ]

  const tenantMap = { tenant1, tenant2, tenant3 }
  const userMap = { tenantUser1, tenantUser2, tenantUser3 }

  for (let i = 0; i < historySurveys.length; i++) {
    const h = historySurveys[i]
    const surveyDate = new Date(now.getTime() - h.days * 24 * 60 * 60 * 1000)
    const tenant = tenantMap[h.tenant]
    const respondent = userMap[h.user]

    await prisma.satisfactionSurvey.upsert({
      where: { id: 100 + i },
      update: {},
      create: {
        tenantId: tenant.id,
        respondentId: respondent.id,
        overallScore: h.score,
        responseSpeed: h.speed,
        serviceAttitude: h.attitude,
        repairQuality: h.quality,
        costReasonable: h.cost,
        comment: h.comment,
        sourceType: h.type.toUpperCase(),
        surveyDate: surveyDate
      }
    })
  }

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
