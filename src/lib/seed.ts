import { PrismaClient, Role, CustomerType, OrderStatus, ItemType, ProcessStatus, StockType, CheckResult, SeverityLevel, FailedItemStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('开始种子数据...');

  const passwordHash = await bcrypt.hash('admin123', 10);

  const users = await Promise.all([
    prisma.user.upsert({
      where: { email: 'admin@example.com' },
      update: {},
      create: {
        name: '张店长',
        email: 'admin@example.com',
        passwordHash,
        role: Role.admin,
      },
    }),
    prisma.user.upsert({
      where: { email: 'reception@example.com' },
      update: {},
      create: {
        name: '李前台',
        email: 'reception@example.com',
        passwordHash,
        role: Role.reception,
      },
    }),
    prisma.user.upsert({
      where: { email: 'tech@example.com' },
      update: {},
      create: {
        name: '王技师',
        email: 'tech@example.com',
        passwordHash,
        role: Role.technician,
      },
    }),
    prisma.user.upsert({
      where: { email: 'store@example.com' },
      update: {},
      create: {
        name: '赵库管',
        email: 'store@example.com',
        passwordHash,
        role: Role.storekeeper,
      },
    }),
    prisma.user.upsert({
      where: { email: 'finance@example.com' },
      update: {},
      create: {
        name: '陈财务',
        email: 'finance@example.com',
        passwordHash,
        role: Role.accountant,
      },
    }),
  ]);

  console.log('用户创建完成');

  const supplier = await prisma.supplier.upsert({
    where: { id: 'supplier-1' },
    update: {},
    create: {
      name: '北京汽配贸易有限公司',
      contact: '刘经理',
      phone: '13900139000',
      address: '北京市朝阳区汽配城A座101',
    },
  });

  console.log('供应商创建完成');

  const customer1 = await prisma.customer.upsert({
    where: { id: 'customer-1' },
    update: {},
    create: {
      name: '张三',
      phone: '13800138001',
      type: CustomerType.vip,
      priceLevel: 3,
    },
  });

  const customer2 = await prisma.customer.upsert({
    where: { id: 'customer-2' },
    update: {},
    create: {
      name: '李四',
      phone: '13800138002',
      type: CustomerType.retail,
      priceLevel: 1,
    },
  });

  console.log('客户创建完成');

  const vehicle1 = await prisma.vehicle.upsert({
    where: { id: 'vehicle-1' },
    update: {},
    create: {
      plateNumber: '京A12345',
      brand: '宝马',
      model: '530Li',
      vin: 'WBA5A5105GG234567',
      mileage: 58000,
      customerId: customer1.id,
    },
  });

  const vehicle2 = await prisma.vehicle.upsert({
    where: { id: 'vehicle-2' },
    update: {},
    create: {
      plateNumber: '京B67890',
      brand: '奔驰',
      model: 'E300L',
      vin: 'LE4ZG5BB0GL123456',
      mileage: 32000,
      customerId: customer2.id,
    },
  });

  console.log('车辆创建完成');

  const parts = await Promise.all([
    prisma.part.upsert({
      where: { sku: 'OF-001' },
      update: {},
      create: {
        sku: 'OF-001',
        name: '机油滤清器',
        category: '滤清器',
        brand: '曼牌',
        spec: 'HU7008Z',
        unit: '个',
        costPrice: 45,
        salePrice: 85,
        stock: 50,
        minStock: 20,
        maxStock: 100,
        supplierId: supplier.id,
      },
    }),
    prisma.part.upsert({
      where: { sku: 'AF-001' },
      update: {},
      create: {
        sku: 'AF-001',
        name: '空气滤芯',
        category: '滤清器',
        brand: '曼牌',
        spec: 'C30005',
        unit: '个',
        costPrice: 65,
        salePrice: 120,
        stock: 8,
        minStock: 15,
        maxStock: 80,
        supplierId: supplier.id,
      },
    }),
    prisma.part.upsert({
      where: { sku: 'CF-001' },
      update: {},
      create: {
        sku: 'CF-001',
        name: '空调滤芯',
        category: '滤清器',
        brand: '马勒',
        spec: 'LAK1184',
        unit: '个',
        costPrice: 52,
        salePrice: 95,
        stock: 45,
        minStock: 20,
        maxStock: 80,
        supplierId: supplier.id,
      },
    }),
    prisma.part.upsert({
      where: { sku: 'MO-001' },
      update: {},
      create: {
        sku: 'MO-001',
        name: '全合成机油',
        category: '润滑系统',
        brand: '美孚',
        spec: '5W-40 4L',
        unit: '桶',
        costPrice: 280,
        salePrice: 480,
        stock: 120,
        minStock: 30,
        maxStock: 150,
        supplierId: supplier.id,
      },
    }),
    prisma.part.upsert({
      where: { sku: 'BP-F-001' },
      update: {},
      create: {
        sku: 'BP-F-001',
        name: '刹车片(前)',
        category: '制动系统',
        brand: '博世',
        spec: '0986AB9423',
        unit: '套',
        costPrice: 380,
        salePrice: 680,
        stock: 5,
        minStock: 10,
        maxStock: 30,
        supplierId: supplier.id,
      },
    }),
  ]);

  console.log('配件创建完成');

  const metrics = await Promise.all([
    prisma.metricConfig.upsert({
      where: { key: 'todayRevenue' },
      update: {},
      create: {
        key: 'todayRevenue',
        name: '今日营收',
        description: '当日已完成订单的总金额',
        formula: 'SUM(orders.totalAmount) WHERE status = "completed" AND DATE(createdAt) = TODAY',
        unit: '元',
        category: '营收',
      },
    }),
    prisma.metricConfig.upsert({
      where: { key: 'todayOrders' },
      update: {},
      create: {
        key: 'todayOrders',
        name: '今日订单',
        description: '当日创建的订单数量',
        formula: 'COUNT(orders) WHERE DATE(createdAt) = TODAY',
        unit: '单',
        category: '订单',
      },
    }),
    prisma.metricConfig.upsert({
      where: { key: 'partTurnoverRate' },
      update: {},
      create: {
        key: 'partTurnoverRate',
        name: '配件周转率',
        description: '平均每日配件周转次数',
        formula: 'SUM(stock_out.quantity) / 30 / AVG(parts.stock)',
        unit: '次/日',
        category: '库存',
      },
    }),
    prisma.metricConfig.upsert({
      where: { key: 'qualityPassRate' },
      update: {},
      create: {
        key: 'qualityPassRate',
        name: '质检合格率',
        description: '质检通过数量占总质检数的比例',
        formula: 'COUNT(quality_checks WHERE result = "passed") / COUNT(quality_checks)',
        unit: '%',
        category: '质量',
      },
    }),
  ]);

  console.log('指标配置创建完成');

  const rolePermissions = [
    { role: Role.admin, resource: 'dashboard', action: 'view' },
    { role: Role.admin, resource: 'orders', action: 'view' },
    { role: Role.admin, resource: 'orders', action: 'create' },
    { role: Role.admin, resource: 'orders', action: 'edit' },
    { role: Role.admin, resource: 'orders', action: 'delete' },
    { role: Role.admin, resource: 'parts', action: 'view' },
    { role: Role.admin, resource: 'parts', action: 'create' },
    { role: Role.admin, resource: 'parts', action: 'edit' },
    { role: Role.admin, resource: 'parts', action: 'delete' },
    { role: Role.admin, resource: 'parts', action: 'export' },
    { role: Role.admin, resource: 'inventory', action: 'view' },
    { role: Role.admin, resource: 'inventory', action: 'create' },
    { role: Role.admin, resource: 'inventory', action: 'edit' },
    { role: Role.admin, resource: 'inventory', action: 'export' },
    { role: Role.admin, resource: 'quality', action: 'view' },
    { role: Role.admin, resource: 'quality', action: 'create' },
    { role: Role.admin, resource: 'quality', action: 'edit' },
    { role: Role.admin, resource: 'price-list', action: 'view' },
    { role: Role.admin, resource: 'price-list', action: 'create' },
    { role: Role.admin, resource: 'price-list', action: 'edit' },
    { role: Role.admin, resource: 'price-list', action: 'delete' },
    { role: Role.admin, resource: 'config', action: 'view' },
    { role: Role.admin, resource: 'config', action: 'edit' },
    { role: Role.admin, resource: 'users', action: 'view' },
    { role: Role.admin, resource: 'users', action: 'create' },
    { role: Role.admin, resource: 'users', action: 'edit' },
    { role: Role.admin, resource: 'users', action: 'delete' },
  ];

  for (const perm of rolePermissions) {
    await prisma.rolePermission.upsert({
      where: { role_resource_action: { role: perm.role, resource: perm.resource, action: perm.action } },
      update: {},
      create: perm,
    });
  }

  console.log('角色权限创建完成');
  console.log('种子数据完成！');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
