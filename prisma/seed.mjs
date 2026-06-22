import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const hashedPassword = await bcrypt.hash('123456', 10)

  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      passwordHash: hashedPassword,
      realName: '系统管理员',
      role: 'ADMIN',
      phone: '13800000000',
      email: 'admin@example.com'
    }
  })

  const operator = await prisma.user.upsert({
    where: { username: 'operator01' },
    update: {},
    create: {
      username: 'operator01',
      passwordHash: hashedPassword,
      realName: '门店运维-张三',
      role: 'STORE_OPERATOR',
      storeCode: 'SH001',
      phone: '13800000001',
      email: 'operator01@example.com'
    }
  })

  const operator2 = await prisma.user.upsert({
    where: { username: 'operator02' },
    update: {},
    create: {
      username: 'operator02',
      passwordHash: hashedPassword,
      realName: '门店运维-李四',
      role: 'STORE_OPERATOR',
      storeCode: 'SH002',
      phone: '13800000002',
      email: 'operator02@example.com'
    }
  })

  console.log('Seed data created:')
  console.log('  - Admin: admin / 123456')
  console.log('  - Operator: operator01 / 123456 (门店 SH001)')
  console.log('  - Operator: operator02 / 123456 (门店 SH002)')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
