import { PrismaClient, Role } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Start seeding...')

  const superAdminPwd = bcrypt.hashSync('admin123', 10)
  const userPwd = bcrypt.hashSync('user123', 10)

  const permissions = [
    { code: 'dashboard:view', name: '查看仪表盘', module: 'dashboard' },
    { code: 'court:manage', name: '场地管理', module: 'court' },
    { code: 'court:price', name: '价格配置', module: 'court' },
    { code: 'booking:view', name: '查看预约', module: 'booking' },
    { code: 'booking:create', name: '创建预约', module: 'booking' },
    { code: 'booking:update', name: '修改预约', module: 'booking' },
    { code: 'booking:cancel', name: '取消预约', module: 'booking' },
    { code: 'booking:checkin', name: '签到核销', module: 'booking' },
    { code: 'booking:abnormal', name: '异常处理', module: 'booking' },
    { code: 'payment:manage', name: '支付管理', module: 'payment' },
    { code: 'payment:refund', name: '退款操作', module: 'payment' },
    { code: 'user:manage', name: '用户管理', module: 'user' },
    { code: 'role:manage', name: '角色权限', module: 'user' },
    { code: 'tournament:manage', name: '赛事管理', module: 'tournament' },
    { code: 'tournament:register', name: '赛事报名', module: 'tournament' },
    { code: 'device:report', name: '设备报修', module: 'device' },
    { code: 'device:handle', name: '设备处理', module: 'device' },
    { code: 'report:view', name: '报表查看', module: 'report' },
    { code: 'report:export', name: '报表导出', module: 'report' },
    { code: 'notice:send', name: '发送通知', module: 'system' },
    { code: 'config:manage', name: '系统配置', module: 'system' }
  ]

  for (const perm of permissions) {
    await prisma.permission.upsert({
      where: { code: perm.code },
      update: perm,
      create: perm
    })
  }

  const allPerms = await prisma.permission.findMany()
  const permIds = allPerms.map(p => p.id)

  await prisma.user.upsert({
    where: { username: 'superadmin' },
    update: { password: superAdminPwd },
    create: {
      username: 'superadmin',
      phone: '13800000000',
      email: 'superadmin@badminton.com',
      password: superAdminPwd,
      realName: '超级管理员',
      role: Role.SUPER_ADMIN,
      status: 1
    }
  })

  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: { password: superAdminPwd },
    create: {
      username: 'admin',
      phone: '13800000001',
      email: 'admin@badminton.com',
      password: superAdminPwd,
      realName: '球馆管理员',
      role: Role.ADMIN,
      status: 1
    }
  })

  const manager = await prisma.user.upsert({
    where: { username: 'manager' },
    update: { password: superAdminPwd },
    create: {
      username: 'manager',
      phone: '13800000002',
      email: 'manager@badminton.com',
      password: superAdminPwd,
      realName: '运营经理',
      role: Role.MANAGER,
      status: 1
    }
  })

  const coach1 = await prisma.user.upsert({
    where: { username: 'coach01' },
    update: { password: superAdminPwd },
    create: {
      username: 'coach01',
      phone: '13800000101',
      email: 'coach01@badminton.com',
      password: superAdminPwd,
      realName: '李教练',
      role: Role.COACH,
      status: 1
    }
  })

  await prisma.coachProfile.upsert({
    where: { userId: coach1.id },
    update: {},
    create: {
      userId: coach1.id,
      level: '高级教练',
      specialty: '单打技术, 青少年培训',
      hourlyRate: 200,
      bio: '国家一级运动员，10年教学经验',
      totalCapacity: 40,
      usedCapacity: 0
    }
  })

  const coach2 = await prisma.user.upsert({
    where: { username: 'coach02' },
    update: { password: superAdminPwd },
    create: {
      username: 'coach02',
      phone: '13800000102',
      email: 'coach02@badminton.com',
      password: superAdminPwd,
      realName: '王教练',
      role: Role.COACH,
      status: 1
    }
  })

  await prisma.coachProfile.upsert({
    where: { userId: coach2.id },
    update: {},
    create: {
      userId: coach2.id,
      level: '中级教练',
      specialty: '双打战术, 成人零基础',
      hourlyRate: 150,
      bio: '省级比赛冠军，8年教学经验',
      totalCapacity: 35,
      usedCapacity: 0
    }
  })

  await prisma.user.upsert({
    where: { username: 'staff01' },
    update: { password: superAdminPwd },
    create: {
      username: 'staff01',
      phone: '13800000201',
      email: 'staff01@badminton.com',
      password: superAdminPwd,
      realName: '前台小张',
      role: Role.STAFF,
      status: 1
    }
  })

  const customer1 = await prisma.user.upsert({
    where: { username: 'user001' },
    update: { password: userPwd },
    create: {
      username: 'user001',
      phone: '13900000001',
      email: 'user001@test.com',
      password: userPwd,
      realName: '张先生',
      role: Role.CUSTOMER,
      balance: 500,
      status: 1
    }
  })

  await prisma.user.upsert({
    where: { username: 'user002' },
    update: { password: userPwd },
    create: {
      username: 'user002',
      phone: '13900000002',
      email: 'user002@test.com',
      password: userPwd,
      realName: '李女士',
      role: Role.CUSTOMER,
      balance: 200,
      status: 1
    }
  })

  const adminRoles = [Role.ADMIN, Role.MANAGER]
  for (const role of adminRoles) {
    for (const permId of permIds) {
      await prisma.rolePermission.upsert({
        where: { role_permissionId: { role, permissionId: permId } },
        update: {},
        create: { role, permissionId: permId }
      })
    }
  }

  const staffPerms = ['dashboard:view', 'booking:view', 'booking:create', 'booking:update', 'booking:checkin', 'device:report']
  for (const permCode of staffPerms) {
    const perm = await prisma.permission.findUnique({ where: { code: permCode } })
    if (perm) {
      await prisma.rolePermission.upsert({
        where: { role_permissionId: { role: Role.STAFF, permissionId: perm.id } },
        update: {},
        create: { role: Role.STAFF, permissionId: perm.id }
      })
    }
  }

  const coachPerms = ['dashboard:view', 'booking:view', 'device:report', 'report:view']
  for (const permCode of coachPerms) {
    const perm = await prisma.permission.findUnique({ where: { code: permCode } })
    if (perm) {
      await prisma.rolePermission.upsert({
        where: { role_permissionId: { role: Role.COACH, permissionId: perm.id } },
        update: {},
        create: { role: Role.COACH, permissionId: perm.id }
      })
    }
  }

  const courtData = [
    { courtNumber: 'C01', name: '1号场地', courtType: '标准单打', location: 'A区-01', maxCapacity: 2 },
    { courtNumber: 'C02', name: '2号场地', courtType: '标准单打', location: 'A区-02', maxCapacity: 2 },
    { courtNumber: 'C03', name: '3号场地', courtType: '标准双打', location: 'A区-03', maxCapacity: 4 },
    { courtNumber: 'C04', name: '4号场地', courtType: '标准双打', location: 'B区-01', maxCapacity: 4 },
    { courtNumber: 'C05', name: '5号场地', courtType: 'VIP双打', location: 'B区-02', maxCapacity: 4, facilities: '空调,休息区,更衣室' },
    { courtNumber: 'C06', name: '6号场地', courtType: 'VIP双打', location: 'B区-03', maxCapacity: 4, facilities: '空调,休息区,更衣室' },
    { courtNumber: 'C07', name: '7号场地', courtType: '儿童训练', location: 'C区-01', maxCapacity: 6 },
    { courtNumber: 'C08', name: '8号场地', courtType: '比赛专用', location: 'C区-02', maxCapacity: 4, facilities: '电子记分牌,观众席' }
  ]

  for (const c of courtData) {
    await prisma.court.upsert({
      where: { courtNumber: c.courtNumber },
      update: c,
      create: c
    })
  }

  const allCourts = await prisma.court.findMany()
  const weekDays = [0, 1, 2, 3, 4, 5, 6]
  const timeSlots = [
    { start: '06:00', end: '09:00', weekdayPrice: 30, holidayPrice: 50, weekdayMember: 20, holidayMember: 35 },
    { start: '09:00', end: '12:00', weekdayPrice: 60, holidayPrice: 100, weekdayMember: 45, holidayMember: 70 },
    { start: '12:00', end: '14:00', weekdayPrice: 50, holidayPrice: 80, weekdayMember: 38, holidayMember: 60 },
    { start: '14:00', end: '18:00', weekdayPrice: 80, holidayPrice: 120, weekdayMember: 60, holidayMember: 90 },
    { start: '18:00', end: '22:00', weekdayPrice: 120, holidayPrice: 150, weekdayMember: 90, holidayMember: 110 },
    { start: '22:00', end: '24:00', weekdayPrice: 60, holidayPrice: 80, weekdayMember: 45, holidayMember: 60 }
  ]

  for (const court of allCourts) {
    const vipMultiplier = court.courtType.includes('VIP') ? 1.5 : court.courtType.includes('比赛') ? 1.3 : 1
    for (const day of weekDays) {
      const isHoliday = day >= 5
      for (const slot of timeSlots) {
        const price = (isHoliday ? slot.holidayPrice : slot.weekdayPrice) * vipMultiplier
        const memberPrice = (isHoliday ? slot.holidayMember : slot.weekdayMember) * vipMultiplier
        await prisma.courtPrice.create({
          data: {
            courtId: court.id,
            weekDay: day,
            startTime: slot.start,
            endTime: slot.end,
            price,
            memberPrice,
            isHoliday
          }
        })
      }
    }
  }

  await prisma.systemConfig.upsert({
    where: { key: 'booking_min_hours' },
    update: {},
    create: { key: 'booking_min_hours', value: '1', type: 'number', desc: '预约最少小时数' }
  })
  await prisma.systemConfig.upsert({
    where: { key: 'booking_max_days' },
    update: {},
    create: { key: 'booking_max_days', value: '7', type: 'number', desc: '可提前预约天数' }
  })
  await prisma.systemConfig.upsert({
    where: { key: 'cancel_advance_minutes' },
    update: {},
    create: { key: 'cancel_advance_minutes', value: '60', type: 'number', desc: '取消预约需提前分钟数' }
  })
  await prisma.systemConfig.upsert({
    where: { key: 'remind_before_minutes' },
    update: {},
    create: { key: 'remind_before_minutes', value: '30', type: 'number', desc: '预约提醒提前分钟数' }
  })
  await prisma.systemConfig.upsert({
    where: { key: 'checkin_grace_minutes' },
    update: {},
    create: { key: 'checkin_grace_minutes', value: '15', type: 'number', desc: '签到宽限分钟数' }
  })

  console.log('Seeding completed!')
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
