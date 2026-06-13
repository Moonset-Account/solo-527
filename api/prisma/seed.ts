import { PrismaClient } from '@prisma/client'
import { hashPassword } from '../lib/auth.js'

const prisma = new PrismaClient()

async function main() {
  await prisma.processRecord.deleteMany()
  await prisma.auditLog.deleteMany()
  await prisma.inspectionTask.deleteMany()
  await prisma.inspectionPlan.deleteMany()
  await prisma.dutySchedule.deleteMany()
  await prisma.alert.deleteMany()
  await prisma.accountRequest.deleteMany()
  await prisma.user.deleteMany()
  await prisma.store.deleteMany()

  const store1 = await prisma.store.create({
    data: { name: '中关村旗舰店', address: '北京市海淀区中关村大街1号' },
  })

  const store2 = await prisma.store.create({
    data: { name: '国贸中心店', address: '北京市朝阳区国贸大厦B座' },
  })

  const adminPassword = await hashPassword('admin123')
  const userPassword = await hashPassword('user123')

  const admin = await prisma.user.create({
    data: {
      username: 'admin',
      password: adminPassword,
      displayName: '系统管理员',
      role: 'admin',
      storeId: store1.id,
    },
  })

  const staff1 = await prisma.user.create({
    data: {
      username: 'zhangsan',
      password: userPassword,
      displayName: '张三',
      role: 'store_ops',
      storeId: store1.id,
    },
  })

  const staff2 = await prisma.user.create({
    data: {
      username: 'lisi',
      password: userPassword,
      displayName: '李四',
      role: 'store_ops',
      storeId: store1.id,
    },
  })

  const staff3 = await prisma.user.create({
    data: {
      username: 'wangwu',
      password: userPassword,
      displayName: '王五',
      role: 'store_ops',
      storeId: store2.id,
    },
  })

  const alert1 = await prisma.alert.create({
    data: {
      title: '收银系统异常',
      level: 'critical',
      source: 'monitoring',
      description: '收银系统无法正常结账，影响门店营业',
      status: 'confirmed',
      confirmedBy: admin.id,
      confirmedAt: new Date(),
      dutyStaffId: staff1.id,
    },
  })

  const alert2 = await prisma.alert.create({
    data: {
      title: '网络连接不稳定',
      level: 'warning',
      source: 'monitoring',
      description: '门店网络间歇性断连',
      status: 'pending',
      dutyStaffId: staff2.id,
    },
  })

  const alert3 = await prisma.alert.create({
    data: {
      title: '打印机离线',
      level: 'info',
      source: 'inspection',
      description: '巡检发现3号打印机离线',
      status: 'escalated',
      escalatedTo: admin.id,
      escalatedAt: new Date(),
      dutyStaffId: staff3.id,
    },
  })

  const request1 = await prisma.accountRequest.create({
    data: {
      accountType: 'ERP',
      purpose: '新员工入职需要ERP系统账号',
      urgency: 'high',
      status: 'approved',
      applicantId: staff1.id,
      approverId: admin.id,
      approvalNote: '同意开通',
      approvedAt: new Date(),
      dutyStaffId: staff2.id,
      completedAt: new Date(),
    },
  })

  const request2 = await prisma.accountRequest.create({
    data: {
      accountType: 'VPN',
      purpose: '远程办公需要VPN权限',
      urgency: 'medium',
      status: 'pending',
      applicantId: staff3.id,
      dutyStaffId: staff1.id,
    },
  })

  const plan1 = await prisma.inspectionPlan.create({
    data: {
      name: '每日设备巡检',
      frequency: 'daily',
      assigneeId: staff1.id,
    },
  })

  const plan2 = await prisma.inspectionPlan.create({
    data: {
      name: '每周安全巡检',
      frequency: 'weekly',
      assigneeId: staff2.id,
    },
  })

  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const nextWeek = new Date(today)
  nextWeek.setDate(nextWeek.getDate() + 7)

  await prisma.inspectionTask.createMany({
    data: [
      {
        planId: plan1.id,
        assigneeId: staff1.id,
        status: 'pending',
        scheduledDate: today,
      },
      {
        planId: plan2.id,
        assigneeId: staff2.id,
        status: 'pending',
        scheduledDate: nextWeek,
      },
    ],
  })

  await prisma.dutySchedule.createMany({
    data: [
      { staffId: staff1.id, date: today, shift: 'morning' },
      { staffId: staff2.id, date: today, shift: 'afternoon' },
      { staffId: staff3.id, date: tomorrow, shift: 'morning' },
      { staffId: staff1.id, date: tomorrow, shift: 'afternoon' },
    ],
  })

  await prisma.processRecord.createMany({
    data: [
      {
        ticketType: 'alert',
        ticketId: alert1.id,
        action: 'created',
        operatorId: staff1.id,
        duration: 0,
      },
      {
        ticketType: 'alert',
        ticketId: alert1.id,
        action: 'confirmed',
        operatorId: admin.id,
        duration: 15,
      },
      {
        ticketType: 'alert',
        ticketId: alert3.id,
        action: 'escalated',
        operatorId: staff3.id,
        duration: 25,
      },
      {
        ticketType: 'account_request',
        ticketId: request1.id,
        action: 'created',
        operatorId: staff1.id,
        duration: 0,
      },
      {
        ticketType: 'account_request',
        ticketId: request1.id,
        action: 'approved',
        operatorId: admin.id,
        duration: 20,
      },
    ],
  })

  await prisma.auditLog.createMany({
    data: [
      {
        operatorId: admin.id,
        action: 'approve_account_request',
        entityType: 'account_request',
        entityId: request1.id,
        detail: '同意开通',
      },
      {
        operatorId: staff3.id,
        action: 'escalate_alert',
        entityType: 'alert',
        entityId: alert3.id,
      },
    ],
  })

  console.log('Seed data created successfully')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
