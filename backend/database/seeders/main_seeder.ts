import { BaseSeeder } from '@adonisjs/lucid/seeders'
import Role from '#models/role'
import Permission from '#models/permission'
import User from '#models/user'
import Plan from '#models/plan'
import BillingCycle from '#models/billing_cycle'
import Seat from '#models/seat'
import UsageRecord from '#models/usage_record'
import Bill from '#models/bill'
import RenewalList from '#models/renewal_list'
import { DateTime } from 'luxon'

export default class extends BaseSeeder {
  async run() {
    console.log('开始播种数据...')

    const permissions = [
      { name: 'user:manage', displayName: '用户管理', description: '管理用户账户' },
      { name: 'role:manage', displayName: '角色管理', description: '管理角色和权限' },
      { name: 'plan:manage', displayName: '套餐管理', description: '管理套餐配置' },
      { name: 'seat:manage', displayName: '席位管理', description: '管理席位开通和配置' },
      { name: 'seat:view', displayName: '席位查看', description: '查看席位信息' },
      { name: 'bill:manage', displayName: '账单管理', description: '管理账单和账期' },
      { name: 'bill:view', displayName: '账单查看', description: '查看账单信息' },
      { name: 'usage:view', displayName: '用量查看', description: '查看用量统计' },
      { name: 'renewal:manage', displayName: '续费管理', description: '管理续费名单' },
      { name: 'renewal:view', displayName: '续费查看', description: '查看续费名单' },
    ]

    const createdPermissions = await Permission.createMany(permissions)
    console.log(`创建了 ${createdPermissions.length} 个权限`)

    const roles = [
      { name: 'admin', displayName: '超级管理员', description: '系统超级管理员，拥有所有权限' },
      { name: 'product_manager', displayName: '产品经理', description: '产品经理，管理套餐、账单和用量' },
      { name: 'operator', displayName: '运营人员', description: '运营人员，管理席位和续费' },
      { name: 'viewer', displayName: '只读用户', description: '只读权限，可查看数据' },
    ]

    const createdRoles = await Role.createMany(roles)
    console.log(`创建了 ${createdRoles.length} 个角色`)

    const adminRole = createdRoles.find(r => r.name === 'admin')!
    const pmRole = createdRoles.find(r => r.name === 'product_manager')!
    const operatorRole = createdRoles.find(r => r.name === 'operator')!
    const viewerRole = createdRoles.find(r => r.name === 'viewer')!

    await adminRole.related('permissions').sync(createdPermissions.map(p => p.id))
    await pmRole.related('permissions').sync(
      createdPermissions.filter(p => ['plan:manage', 'bill:manage', 'bill:view', 'usage:view', 'seat:view', 'renewal:view'].includes(p.name)).map(p => p.id)
    )
    await operatorRole.related('permissions').sync(
      createdPermissions.filter(p => ['seat:manage', 'seat:view', 'renewal:manage', 'renewal:view', 'usage:view', 'bill:view'].includes(p.name)).map(p => p.id)
    )
    await viewerRole.related('permissions').sync(
      createdPermissions.filter(p => p.name.endsWith(':view')).map(p => p.id)
    )
    console.log('角色权限分配完成')

    const adminUser = await User.create({
      email: 'admin@example.com',
      password: 'Admin@123456',
      fullName: '系统管理员',
      phone: '13800138000',
      department: '技术部',
      status: 'active',
    })

    const pmUser = await User.create({
      email: 'pm@example.com',
      password: 'Pm@123456',
      fullName: '张产品',
      phone: '13800138001',
      department: '产品部',
      status: 'active',
    })

    const operatorUser = await User.create({
      email: 'operator@example.com',
      password: 'Operator@123456',
      fullName: '李运营',
      phone: '13800138002',
      department: '运营部',
      status: 'active',
    })

    await adminUser.related('roles').sync([adminRole.id])
    await pmUser.related('roles').sync([pmRole.id])
    await operatorUser.related('roles').sync([operatorRole.id])
    console.log('创建了 3 个测试用户')

    const plans = [
      {
        name: '基础版',
        code: 'basic',
        description: '适合小型团队和个人使用',
        priceMonthly: 99.00,
        priceYearly: 999.00,
        apiCallsLimit: 10000,
        seatLimit: 1,
        features: {
          apiCalls: '1万次/月',
          support: '邮件支持',
          analytics: '基础统计',
        },
        status: 'active',
        sortOrder: 1,
      },
      {
        name: '专业版',
        code: 'pro',
        description: '适合成长中的企业',
        priceMonthly: 299.00,
        priceYearly: 2999.00,
        apiCallsLimit: 100000,
        seatLimit: 5,
        features: {
          apiCalls: '10万次/月',
          support: '优先邮件+电话支持',
          analytics: '高级统计+报表',
          customIntegration: true,
        },
        status: 'active',
        sortOrder: 2,
      },
      {
        name: '企业版',
        code: 'enterprise',
        description: '适合大型企业定制化需求',
        priceMonthly: 999.00,
        priceYearly: 9999.00,
        apiCallsLimit: 1000000,
        seatLimit: 50,
        features: {
          apiCalls: '100万次/月',
          support: '7x24专属客服',
          analytics: '完整数据分析',
          customIntegration: true,
          dedicatedAccountManager: true,
          sla: '99.9%',
        },
        status: 'active',
        sortOrder: 3,
      },
    ]

    const createdPlans = await Plan.createMany(plans)
    console.log(`创建了 ${createdPlans.length} 个套餐`)

    const billingCycles = [
      { name: '月付', cycleType: 'monthly', dayOfMonth: 1, isDefault: true, status: 'active' },
      { name: '年付', cycleType: 'yearly', dayOfMonth: 1, isDefault: false, status: 'active' },
      { name: '季度付', cycleType: 'custom', dayOfMonth: 1, isDefault: false, status: 'active' },
    ]

    await BillingCycle.createMany(billingCycles)
    console.log('创建了 3 个账期配置')

    const customers = [
      { id: 'C001', name: '阿里巴巴集团' },
      { id: 'C002', name: '腾讯科技' },
      { id: 'C003', name: '百度在线' },
      { id: 'C004', name: '字节跳动' },
      { id: 'C005', name: '京东集团' },
      { id: 'C006', name: '美团点评' },
      { id: 'C007', name: '拼多多' },
      { id: 'C008', name: '小米科技' },
      { id: 'C009', name: '华为技术' },
      { id: 'C010', name: '网易公司' },
    ]

    const seats = []
    const statuses = ['trial', 'active', 'suspended', 'expired']
    const billingCycles2 = ['monthly', 'yearly']

    for (let i = 0; i < 20; i++) {
      const customer = customers[i % customers.length]
      const plan = createdPlans[i % createdPlans.length]
      const status = statuses[i % statuses.length]
      const startDate = DateTime.now().minus({ days: Math.floor(Math.random() * 365) })
      const endDate = status === 'trial' 
        ? startDate.plus({ days: 14 }) 
        : startDate.plus({ months: billingCycles2[i % 2] === 'monthly' ? 1 : 12 })
      
      const apiCallsUsed = Math.floor(Math.random() * plan.apiCallsLimit)
      const isIdle = apiCallsUsed < 100 && status === 'active'
      
      seats.push({
        customerId: customer.id,
        customerName: customer.name,
        planId: plan.id,
        seatCode: `SEAT-${String(i + 1).padStart(5, '0')}`,
        status: status,
        billingCycle: billingCycles2[i % 2],
        apiKey: `sk_${Math.random().toString(36).substring(2, 34)}`,
        apiCallsUsed: apiCallsUsed,
        apiCallsLimit: plan.apiCallsLimit,
        startDate: startDate.toJSDate(),
        endDate: endDate.toJSDate(),
        trialEndDate: status === 'trial' ? endDate.toJSDate() : null,
        isIdle: isIdle,
        idleDays: isIdle ? Math.floor(Math.random() * 30) : 0,
        lastActivityAt: DateTime.now().minus({ days: Math.floor(Math.random() * 30) }).toJSDate(),
        notes: i % 3 === 0 ? '重点关注客户' : null,
        createdBy: adminUser.id,
      })
    }

    const createdSeats = await Seat.createMany(seats as any)
    console.log(`创建了 ${createdSeats.length} 个席位`)

    console.log('生成用量记录...')
    const usageRecords = []
    const endpoints = ['/api/v1/users', '/api/v1/orders', '/api/v1/products', '/api/v1/analytics', '/api/v1/reports']
    const methods = ['GET', 'POST', 'PUT', 'DELETE']
    
    for (let i = 0; i < 500; i++) {
      const seat = createdSeats[Math.floor(Math.random() * createdSeats.length)]
      const isError = Math.random() < 0.05
      const date = DateTime.now().minus({ days: Math.floor(Math.random() * 30) })
      
      usageRecords.push({
        seatId: seat.id,
        apiEndpoint: endpoints[Math.floor(Math.random() * endpoints.length)],
        method: methods[Math.floor(Math.random() * methods.length)],
        statusCode: isError ? (400 + Math.floor(Math.random() * 200)) : 200,
        responseTime: Math.floor(Math.random() * 500) + 20,
        requestDate: date.toISODate(),
        isError: isError,
        errorMessage: isError ? ['Rate limit exceeded', 'Invalid token', 'Internal server error', 'Bad request'][Math.floor(Math.random() * 4)] : null,
        createdAt: date.toJSDate(),
      })
    }

    await UsageRecord.createMany(usageRecords as any)
    console.log(`创建了 ${usageRecords.length} 条用量记录`)

    console.log('生成账单...')
    const bills = []
    for (let i = 0; i < 15; i++) {
      const seat = createdSeats[i]
      const month = DateTime.now().minus({ months: Math.floor(Math.random() * 3) })
      const amount = [99, 299, 999][i % 3]
      
      bills.push({
        billNo: `BILL${month.toFormat('yyyyMM')}${String(i + 1).padStart(5, '0')}`,
        seatId: seat.id,
        customerId: seat.customerId,
        customerName: seat.customerName,
        planName: createdPlans[i % createdPlans.length].name,
        billingMonth: month.toFormat('yyyy-MM'),
        periodStart: month.startOf('month').toJSDate(),
        periodEnd: month.endOf('month').toJSDate(),
        amount: amount,
        apiCallsUsed: Math.floor(Math.random() * 10000),
        status: ['draft', 'unpaid', 'paid', 'overdue'][i % 4],
        dueDate: month.plus({ days: 15 }).toJSDate(),
        paidAt: i % 3 === 0 ? month.plus({ days: 10 }).toJSDate() : null,
        remark: i % 4 === 0 ? '自动扣款成功' : null,
        createdBy: adminUser.id,
      })
    }

    await Bill.createMany(bills as any)
    console.log(`创建了 ${bills.length} 个账单`)

    console.log('生成续费名单...')
    const renewalEntries = []
    const priorities = ['high', 'medium', 'low']
    const renewalStatuses = ['pending', 'contacted', 'renewed', 'lost']

    for (let i = 0; i < 12; i++) {
      const seat = createdSeats[i + 5]
      const expiryDate = DateTime.now().plus({ days: Math.floor(Math.random() * 60) + 10 })
      
      renewalEntries.push({
        seatId: seat.id,
        customerId: seat.customerId,
        customerName: seat.customerName,
        planName: createdPlans[i % createdPlans.length].name,
        expiryDate: expiryDate.toJSDate(),
        status: renewalStatuses[i % renewalStatuses.length],
        priority: priorities[i % priorities.length],
        assignedTo: i % 2 === 0 ? operatorUser.id : null,
        lastFollowUpAt: i % 3 === 0 ? DateTime.now().minus({ days: Math.floor(Math.random() * 7) }).toJSDate() : null,
        nextFollowUpAt: DateTime.now().plus({ days: Math.floor(Math.random() * 7) }).toJSDate(),
        notes: i % 2 === 0 ? '客户意向较高，需重点跟进' : null,
      })
    }

    await RenewalList.createMany(renewalEntries as any)
    console.log(`创建了 ${renewalEntries.length} 条续费名单`)

    console.log('✅ 数据播种完成！')
    console.log('')
    console.log('测试账号：')
    console.log('  管理员: admin@example.com / Admin@123456')
    console.log('  产品经理: pm@example.com / Pm@123456')
    console.log('  运营人员: operator@example.com / Operator@123456')
  }
}
