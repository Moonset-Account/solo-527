const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  console.log('开始种子数据...')

  const hashedPassword = bcrypt.hashSync('123456', 10)

  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: hashedPassword,
      realName: '系统管理员',
      role: 'admin',
      department: '信息部',
    },
  })
  console.log('创建管理员:', admin.username)

  const projectManager = await prisma.user.upsert({
    where: { username: 'pm01' },
    update: {},
    create: {
      username: 'pm01',
      password: hashedPassword,
      realName: '张经理',
      role: 'project_manager',
      department: '工程部',
    },
  })
  console.log('创建项目经理:', projectManager.username)

  const procurementManager = await prisma.user.upsert({
    where: { username: 'procurement' },
    update: {},
    create: {
      username: 'procurement',
      password: hashedPassword,
      realName: '李采购',
      role: 'procurement_manager',
      department: '采购部',
    },
  })
  console.log('创建采购经理:', procurementManager.username)

  const finance = await prisma.user.upsert({
    where: { username: 'finance' },
    update: {},
    create: {
      username: 'finance',
      password: hashedPassword,
      realName: '王财务',
      role: 'finance',
      department: '财务部',
    },
  })
  console.log('创建财务:', finance.username)

  const levels = [
    { level: 1, name: '一级审批', role: 'project_manager', minAmount: 0, maxAmount: 10000 },
    { level: 2, name: '二级审批', role: 'procurement_manager', minAmount: 10000, maxAmount: 100000 },
    { level: 3, name: '三级审批', role: 'finance', minAmount: 100000, maxAmount: 1000000 },
    { level: 4, name: '四级审批', role: 'admin', minAmount: 1000000, maxAmount: 99999999 },
  ]

  for (const lvl of levels) {
    await prisma.approvalLevel.upsert({
      where: { level: lvl.level },
      update: lvl,
      create: lvl,
    })
    console.log('创建审批层级:', lvl.name)
  }

  const suppliers = [
    { name: '华建建材有限公司', code: 'GYS001', contact: '陈总', phone: '13800138001', address: '北京市朝阳区建材路1号' },
    { name: '盛达钢铁贸易公司', code: 'GYS002', contact: '刘经理', phone: '13800138002', address: '上海市浦东新区钢铁大道88号' },
    { name: '恒通水泥制品厂', code: 'GYS003', contact: '赵厂长', phone: '13800138003', address: '广州市白云区水泥厂路5号' },
  ]

  for (const supplier of suppliers) {
    await prisma.supplier.upsert({
      where: { code: supplier.code },
      update: {},
      create: supplier,
    })
    console.log('创建供应商:', supplier.name)
  }

  const supplier1 = await prisma.supplier.findUnique({ where: { code: 'GYS001' } })
  const supplier2 = await prisma.supplier.findUnique({ where: { code: 'GYS002' } })

  const priceHistory = [
    { supplierId: supplier1.id, materialName: '42.5级硅酸盐水泥', specification: 'P.O 42.5', unit: '吨', price: 580, effectiveDate: new Date('2024-01-01') },
    { supplierId: supplier1.id, materialName: '42.5级硅酸盐水泥', specification: 'P.O 42.5', unit: '吨', price: 620, effectiveDate: new Date('2024-03-01') },
    { supplierId: supplier1.id, materialName: '42.5级硅酸盐水泥', specification: 'P.O 42.5', unit: '吨', price: 650, effectiveDate: new Date('2024-06-01') },
    { supplierId: supplier2.id, materialName: 'HRB400螺纹钢', specification: 'Φ16', unit: '吨', price: 4200, effectiveDate: new Date('2024-01-01') },
    { supplierId: supplier2.id, materialName: 'HRB400螺纹钢', specification: 'Φ16', unit: '吨', price: 4500, effectiveDate: new Date('2024-04-01') },
    { supplierId: supplier2.id, materialName: 'HRB400螺纹钢', specification: 'Φ20', unit: '吨', price: 4300, effectiveDate: new Date('2024-01-01') },
  ]

  for (const ph of priceHistory) {
    await prisma.priceHistory.create({ data: ph })
  }
  console.log('创建价格历史记录:', priceHistory.length, '条')

  console.log('种子数据完成!')
  console.log('')
  console.log('测试账号:')
  console.log('  admin / 123456 (管理员)')
  console.log('  pm01 / 123456 (项目经理)')
  console.log('  procurement / 123456 (采购经理)')
  console.log('  finance / 123456 (财务)')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
