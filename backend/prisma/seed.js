import { PrismaClient, UserRole, PurchaseOrderStatus, InboundStatus, OutboundStatus, ExceptionType, ExceptionStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dayjs from 'dayjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 开始初始化数据...');

  const hashPassword = (pwd) => bcrypt.hashSync(pwd, 10);

  // 1. 创建用户
  console.log('👤 创建用户...');
  const users = await prisma.user.createMany({
    data: [
      {
        username: 'superadmin',
        passwordHash: hashPassword('123456'),
        realName: '超级管理员',
        email: 'super@warehouse.com',
        phone: '13800000000',
        role: UserRole.SUPER_ADMIN,
        isActive: true,
      },
      {
        username: 'manager',
        passwordHash: hashPassword('123456'),
        realName: '王主管',
        email: 'manager@warehouse.com',
        phone: '13800000001',
        role: UserRole.WAREHOUSE_MANAGER,
        isActive: true,
      },
      {
        username: 'purchase',
        passwordHash: hashPassword('123456'),
        realName: '李采购',
        email: 'purchase@warehouse.com',
        phone: '13800000002',
        role: UserRole.PURCHASE_STAFF,
        isActive: true,
      },
      {
        username: 'qc',
        passwordHash: hashPassword('123456'),
        realName: '张质检',
        email: 'qc@warehouse.com',
        phone: '13800000003',
        role: UserRole.QC_STAFF,
        isActive: true,
      },
      {
        username: 'viewer',
        passwordHash: hashPassword('123456'),
        realName: '赵查看',
        email: 'viewer@warehouse.com',
        phone: '13800000004',
        role: UserRole.VIEWER,
        isActive: true,
      },
    ],
    skipDuplicates: true,
  });
  console.log(`✅ 创建了 ${users.count} 个系统用户`);

  // 2. 创建供应商
  console.log('🏢 创建供应商...');
  const [supplier1, supplier2, supplier3, supplier4, supplier5] = await Promise.all([
    prisma.supplier.create({
      data: {
        code: 'SUP001',
        name: '绿源有机蔬菜基地',
        contactPerson: '陈经理',
        phone: '13911110001',
        email: 'chen@lvyuan.com',
        address: '山东省寿光市蔬菜产业园A区12号',
        category: '蔬菜类',
        level: 1,
        status: 'ACTIVE',
        rating: 4.7,
        totalOrders: 156,
        onTimeRate: 96.5,
        qcPassRate: 98.2,
        contractStart: dayjs().subtract(2, 'year').toDate(),
        contractEnd: dayjs().add(1, 'year').toDate(),
        remark: '叶菜类主要供应商，冷链配送',
      },
    }),
    prisma.supplier.create({
      data: {
        code: 'SUP002',
        name: '鲜果时光果品有限公司',
        contactPerson: '刘总',
        phone: '13911110002',
        email: 'liu@xianguo.com',
        address: '云南省昆明市呈贡区农产品批发市场',
        category: '水果类',
        level: 1,
        status: 'ACTIVE',
        rating: 4.5,
        totalOrders: 98,
        onTimeRate: 92.3,
        qcPassRate: 95.8,
        contractStart: dayjs().subtract(1, 'year').toDate(),
        contractEnd: dayjs().add(6, 'month').toDate(),
        remark: '热带水果专业供应商',
      },
    }),
    prisma.supplier.create({
      data: {
        code: 'SUP003',
        name: '海味鲜水产',
        contactPerson: '周老板',
        phone: '13911110003',
        email: 'zhou@haiweixian.com',
        address: '浙江省舟山市定海区干览镇',
        category: '水产类',
        level: 2,
        status: 'ACTIVE',
        rating: 4.2,
        totalOrders: 67,
        onTimeRate: 88.5,
        qcPassRate: 91.3,
        contractStart: dayjs().subtract(8, 'month').toDate(),
        contractEnd: dayjs().add(4, 'month').toDate(),
      },
    }),
    prisma.supplier.create({
      data: {
        code: 'SUP004',
        name: '草原优选肉业',
        contactPerson: '巴图',
        phone: '13911110004',
        email: 'batu@caoyuan.com',
        address: '内蒙古呼和浩特市和林格尔县',
        category: '肉禽类',
        level: 2,
        status: 'ACTIVE',
        rating: 4.6,
        totalOrders: 45,
        onTimeRate: 94.2,
        qcPassRate: 97.1,
      },
    }),
    prisma.supplier.create({
      data: {
        code: 'SUP005',
        name: '恒兴蛋品合作社',
        contactPerson: '吴社长',
        phone: '13911110005',
        email: 'wu@hengxing.com',
        address: '河北省保定市徐水区大因镇',
        category: '蛋奶类',
        level: 3,
        status: 'ACTIVE',
        rating: 4.0,
        totalOrders: 23,
        onTimeRate: 85.0,
        qcPassRate: 89.5,
      },
    }),
  ]);
  console.log(`✅ 创建了 5 个供应商`);

  // 为供应商创建供应商账号
  await prisma.user.createMany({
    data: [
      {
        username: 'sup001',
        passwordHash: hashPassword('123456'),
        realName: '绿源-陈经理',
        email: 'chen@lvyuan.com',
        phone: '13911110001',
        role: UserRole.SUPPLIER,
        supplierId: supplier1.id,
        isActive: true,
      },
      {
        username: 'sup002',
        passwordHash: hashPassword('123456'),
        realName: '鲜果-刘总',
        email: 'liu@xianguo.com',
        phone: '13911110002',
        role: UserRole.SUPPLIER,
        supplierId: supplier2.id,
        isActive: true,
      },
      {
        username: 'sup003',
        passwordHash: hashPassword('123456'),
        realName: '海味-周老板',
        email: 'zhou@haiweixian.com',
        phone: '13911110003',
        role: UserRole.SUPPLIER,
        supplierId: supplier3.id,
        isActive: true,
      },
    ],
    skipDuplicates: true,
  });
  console.log('✅ 创建了 3 个供应商账号');

  // 3. 创建商品分类
  console.log('📦 创建商品分类...');
  const [catVegetable, catFruit, catSeafood, catMeat, catEgg] = await Promise.all([
    prisma.category.create({ data: { name: '蔬菜类', code: 'VEG', sortOrder: 1 } }),
    prisma.category.create({ data: { name: '水果类', code: 'FRU', sortOrder: 2 } }),
    prisma.category.create({ data: { name: '水产类', code: 'SEA', sortOrder: 3 } }),
    prisma.category.create({ data: { name: '肉禽类', code: 'MEA', sortOrder: 4 } }),
    prisma.category.create({ data: { name: '蛋奶类', code: 'EGG', sortOrder: 5 } }),
  ]);
  console.log('✅ 创建了 5 个商品分类');

  // 4. 创建商品
  console.log('🥬 创建商品...');
  const products = await prisma.product.createMany({
    data: [
      // 蔬菜类
      { sku: 'V001', barcode: '6900001000001', name: '有机小白菜', categoryId: catVegetable.id, unit: 'kg', spec: '500g/把', shelfLifeDays: 5, warningDays: 2, minStock: 50, maxStock: 300, defaultPrice: 4.5, storageCondition: '冷藏0-4°C', preferredSupplierId: supplier1.id, isActive: true },
      { sku: 'V002', barcode: '6900001000002', name: '上海青', categoryId: catVegetable.id, unit: 'kg', spec: '散装', shelfLifeDays: 5, warningDays: 2, minStock: 60, maxStock: 400, defaultPrice: 3.8, storageCondition: '冷藏0-4°C', preferredSupplierId: supplier1.id, isActive: true },
      { sku: 'V003', barcode: '6900001000003', name: '西红柿', categoryId: catVegetable.id, unit: 'kg', spec: '一级', shelfLifeDays: 10, warningDays: 3, minStock: 80, maxStock: 500, defaultPrice: 5.2, storageCondition: '常温阴凉', preferredSupplierId: supplier1.id, isActive: true },
      { sku: 'V004', barcode: '6900001000004', name: '黄瓜', categoryId: catVegetable.id, unit: 'kg', spec: '精品', shelfLifeDays: 7, warningDays: 2, minStock: 70, maxStock: 400, defaultPrice: 3.5, storageCondition: '冷藏0-8°C', preferredSupplierId: supplier1.id, isActive: true },
      { sku: 'V005', barcode: '6900001000005', name: '胡萝卜', categoryId: catVegetable.id, unit: 'kg', spec: '水洗', shelfLifeDays: 30, warningDays: 7, minStock: 40, maxStock: 300, defaultPrice: 2.8, storageCondition: '冷藏0-4°C', preferredSupplierId: supplier1.id, isActive: true },
      { sku: 'V006', barcode: '6900001000006', name: '土豆', categoryId: catVegetable.id, unit: 'kg', spec: '一级', shelfLifeDays: 60, warningDays: 10, minStock: 100, maxStock: 600, defaultPrice: 2.5, storageCondition: '常温阴凉', preferredSupplierId: supplier1.id, isActive: true },
      { sku: 'V007', barcode: '6900001000007', name: '青椒', categoryId: catVegetable.id, unit: 'kg', spec: '精品', shelfLifeDays: 10, warningDays: 3, minStock: 45, maxStock: 250, defaultPrice: 6.8, storageCondition: '冷藏5-8°C', preferredSupplierId: supplier1.id, isActive: true },
      { sku: 'V008', barcode: '6900001000008', name: '生菜', categoryId: catVegetable.id, unit: 'kg', spec: '叶用', shelfLifeDays: 4, warningDays: 1, minStock: 40, maxStock: 200, defaultPrice: 5.5, storageCondition: '冷藏0-4°C', preferredSupplierId: supplier1.id, isActive: true },
      // 水果类
      { sku: 'F001', barcode: '6900002000001', name: '红富士苹果', categoryId: catFruit.id, unit: 'kg', spec: '80#', shelfLifeDays: 60, warningDays: 10, minStock: 200, maxStock: 1000, defaultPrice: 6.8, storageCondition: '冷藏0-2°C', preferredSupplierId: supplier2.id, isActive: true },
      { sku: 'F002', barcode: '6900002000002', name: '香蕉', categoryId: catFruit.id, unit: 'kg', spec: 'A级', shelfLifeDays: 7, warningDays: 2, minStock: 150, maxStock: 600, defaultPrice: 5.0, storageCondition: '常温13-15°C', preferredSupplierId: supplier2.id, isActive: true },
      { sku: 'F003', barcode: '6900002000003', name: '丑橘', categoryId: catFruit.id, unit: 'kg', spec: '大果', shelfLifeDays: 20, warningDays: 5, minStock: 100, maxStock: 500, defaultPrice: 8.5, storageCondition: '冷藏5-8°C', preferredSupplierId: supplier2.id, isActive: true },
      { sku: 'F004', barcode: '6900002000004', name: '圣女果', categoryId: catFruit.id, unit: 'kg', spec: '盒装', shelfLifeDays: 10, warningDays: 3, minStock: 60, maxStock: 300, defaultPrice: 9.8, storageCondition: '冷藏2-5°C', preferredSupplierId: supplier2.id, isActive: true },
      { sku: 'F005', barcode: '6900002000005', name: '西瓜', categoryId: catFruit.id, unit: 'kg', spec: '麒麟瓜', shelfLifeDays: 15, warningDays: 5, minStock: 200, maxStock: 800, defaultPrice: 3.5, storageCondition: '常温阴凉', preferredSupplierId: supplier2.id, isActive: true },
      { sku: 'F006', barcode: '6900002000006', name: '芒果', categoryId: catFruit.id, unit: 'kg', spec: '凯特', shelfLifeDays: 12, warningDays: 3, minStock: 80, maxStock: 400, defaultPrice: 12.5, storageCondition: '常温10-15°C', preferredSupplierId: supplier2.id, isActive: true },
      // 水产类
      { sku: 'S001', barcode: '6900003000001', name: '冻带鱼', categoryId: catSeafood.id, unit: 'kg', spec: '7-9条/斤', shelfLifeDays: 180, warningDays: 30, minStock: 100, maxStock: 500, defaultPrice: 28.0, storageCondition: '冷冻-18°C以下', preferredSupplierId: supplier3.id, isActive: true },
      { sku: 'S002', barcode: '6900003000002', name: '冰鲜三文鱼', categoryId: catSeafood.id, unit: 'kg', spec: '中段', shelfLifeDays: 3, warningDays: 1, minStock: 20, maxStock: 80, defaultPrice: 88.0, storageCondition: '冷藏0-4°C', preferredSupplierId: supplier3.id, isActive: true },
      { sku: 'S003', barcode: '6900003000003', name: '活虾', categoryId: catSeafood.id, unit: 'kg', spec: '40头', shelfLifeDays: 1, warningDays: 0, minStock: 30, maxStock: 100, defaultPrice: 45.0, storageCondition: '充氧暂养', preferredSupplierId: supplier3.id, isActive: true },
      { sku: 'S004', barcode: '6900003000004', name: '冻虾仁', categoryId: catSeafood.id, unit: 'kg', spec: '130/150', shelfLifeDays: 240, warningDays: 30, minStock: 50, maxStock: 200, defaultPrice: 55.0, storageCondition: '冷冻-18°C以下', preferredSupplierId: supplier3.id, isActive: true },
      // 肉禽类
      { sku: 'M001', barcode: '6900004000001', name: '冷鲜猪里脊', categoryId: catMeat.id, unit: 'kg', spec: '冷鲜', shelfLifeDays: 3, warningDays: 1, minStock: 40, maxStock: 150, defaultPrice: 28.5, storageCondition: '冷藏0-4°C', preferredSupplierId: supplier4.id, isActive: true },
      { sku: 'M002', barcode: '6900004000002', name: '冷鲜牛腩', categoryId: catMeat.id, unit: 'kg', spec: '冷鲜', shelfLifeDays: 5, warningDays: 1, minStock: 30, maxStock: 120, defaultPrice: 52.0, storageCondition: '冷藏0-4°C', preferredSupplierId: supplier4.id, isActive: true },
      { sku: 'M003', barcode: '6900004000003', name: '冻鸡腿', categoryId: catMeat.id, unit: 'kg', spec: '单冻', shelfLifeDays: 180, warningDays: 30, minStock: 80, maxStock: 400, defaultPrice: 16.5, storageCondition: '冷冻-18°C以下', preferredSupplierId: supplier4.id, isActive: true },
      { sku: 'M004', barcode: '6900004000004', name: '冷鲜羊排', categoryId: catMeat.id, unit: 'kg', spec: '冷鲜', shelfLifeDays: 4, warningDays: 1, minStock: 20, maxStock: 80, defaultPrice: 68.0, storageCondition: '冷藏0-4°C', preferredSupplierId: supplier4.id, isActive: true },
      // 蛋奶类
      { sku: 'E001', barcode: '6900005000001', name: '鲜鸡蛋', categoryId: catEgg.id, unit: 'kg', spec: '30枚/盒', shelfLifeDays: 30, warningDays: 7, minStock: 200, maxStock: 800, defaultPrice: 11.8, storageCondition: '常温阴凉', preferredSupplierId: supplier5.id, isActive: true },
      { sku: 'E002', barcode: '6900005000002', name: '柴鸡蛋', categoryId: catEgg.id, unit: 'kg', spec: '散养', shelfLifeDays: 45, warningDays: 10, minStock: 100, maxStock: 400, defaultPrice: 18.5, storageCondition: '常温阴凉', preferredSupplierId: supplier5.id, isActive: true },
      { sku: 'E003', barcode: '6900005000003', name: '鲜牛奶', categoryId: catEgg.id, unit: 'L', spec: '巴氏杀菌', shelfLifeDays: 7, warningDays: 2, minStock: 150, maxStock: 500, defaultPrice: 12.0, storageCondition: '冷藏2-6°C', preferredSupplierId: supplier5.id, isActive: true },
    ],
  });
  console.log(`✅ 创建了 ${products.count} 个商品`);

  const allProducts = await prisma.product.findMany();

  // 5. 创建商品-供应商关联
  console.log('🔗 创建商品-供应商关联...');
  const productSupplierData = [];
  for (const p of allProducts) {
    productSupplierData.push({
      productId: p.id,
      supplierId: p.preferredSupplierId,
      price: p.defaultPrice ? p.defaultPrice.toNumber() : 0,
      leadTimeDays: 1,
      isPreferred: true,
      priority: 1,
    });
  }
  await prisma.productSupplier.createMany({ data: productSupplierData, skipDuplicates: true });
  console.log('✅ 商品-供应商关联完成');

  // 6. 创建库存
  console.log('📊 创建库存记录...');
  const zones = ['A区-常温', 'B区-冷藏', 'C区-冷冻', 'D区-暂养'];
  const inventoryData = [];
  for (const p of allProducts) {
    let zone = 'A区-常温';
    if (p.storageCondition?.includes('冷冻')) zone = 'C区-冷冻';
    else if (p.storageCondition?.includes('冷藏') || p.storageCondition?.includes('暂养')) zone = 'B区-冷藏';
    const baseQty = Math.floor(Math.random() * 200) + 50;
    inventoryData.push({
      productId: p.id,
      warehouseZone: zone,
      location: `${zone.charAt(0)}-${String(Math.floor(Math.random() * 20) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 5) + 1)}`,
      totalQty: baseQty,
      availableQty: Math.floor(baseQty * 0.85),
      reservedQty: Math.floor(baseQty * 0.1),
      damagedQty: Math.floor(baseQty * 0.05),
      lastCheckedAt: dayjs().subtract(Math.floor(Math.random() * 5), 'day').toDate(),
    });
  }
  await prisma.inventory.createMany({ data: inventoryData, skipDuplicates: true });
  const allInventories = await prisma.inventory.findMany({ include: { product: true } });
  console.log(`✅ 创建了 ${allInventories.length} 条库存记录`);

  // 7. 创建批次
  console.log('🏷️ 创建批次记录...');
  const batchData = [];
  let batchCounter = 1;
  for (const inv of allInventories) {
    const numBatches = Math.floor(Math.random() * 3) + 1;
    for (let i = 0; i < numBatches; i++) {
      const prod = inv.product;
      const qty = Math.floor(inv.totalQty / numBatches);
      const produceOffset = Math.floor(Math.random() * 5) + 1;
      const produceDate = dayjs().subtract(produceOffset, 'day');
      const expiryDate = produceDate.add(prod.shelfLifeDays || 30, 'day');
      const now = dayjs();
      let status = 'NORMAL';
      let qcStatus = 'PASSED';
      if (expiryDate.isBefore(now)) {
        status = 'EXPIRED';
      } else if (expiryDate.diff(now, 'day') <= prod.warningDays) {
        status = 'NEAR_EXPIRY';
      }
      batchData.push({
        batchNo: `B${dayjs().format('YYYYMMDD')}${String(batchCounter++).padStart(5, '0')}`,
        productId: prod.id,
        supplierId: prod.preferredSupplierId || supplier1.id,
        inventoryId: inv.id,
        qty: qty,
        remainingQty: Math.floor(qty * (0.6 + Math.random() * 0.35)),
        lockedQty: 0,
        produceDate: produceDate.toDate(),
        expiryDate: expiryDate.toDate(),
        inboundDate: produceDate.add(1, 'day').toDate(),
        price: prod.defaultPrice?.toNumber(),
        status,
        qcStatus,
      });
    }
  }
  await prisma.batch.createMany({ data: batchData, skipDuplicates: true });
  console.log(`✅ 创建了 ${batchData.length} 个批次记录`);

  // 8. 创建采购单
  console.log('📝 创建采购单...');
  const managerUser = await prisma.user.findUnique({ where: { username: 'manager' } });
  const purchaseUser = await prisma.user.findUnique({ where: { username: 'purchase' } });
  const supAll = [supplier1, supplier2, supplier3, supplier4, supplier5];
  const poStatuses = [
    PurchaseOrderStatus.PENDING_SUPPLIER,
    PurchaseOrderStatus.SUPPLIER_CONFIRMED,
    PurchaseOrderStatus.PARTIAL_DELIVERED,
    PurchaseOrderStatus.FULLY_DELIVERED,
    PurchaseOrderStatus.COMPLETED,
  ];

  for (let i = 0; i < 8; i++) {
    const s = supAll[i % supAll.length];
    const status = poStatuses[i % poStatuses.length];
    const poDate = dayjs().subtract(i * 2, 'day');
    const po = await prisma.purchaseOrder.create({
      data: {
        orderNo: `PO${poDate.format('YYYYMMDD')}${String(i + 1).padStart(3, '0')}`,
        supplierId: s.id,
        status,
        createdById: purchaseUser.id,
        assignedToId: i % 3 === 0 ? managerUser.id : purchaseUser.id,
        expectedDate: poDate.add(1 + (i % 3), 'day').toDate(),
        urgentLevel: i % 4 === 0 ? 3 : 1,
        requireQc: true,
        remark: i === 0 ? '加急配送，请尽快安排' : null,
        createdAt: poDate.toDate(),
      },
    });
    // 采购单项
    const supProducts = allProducts.filter(p => p.preferredSupplierId === s.id);
    const itemCount = Math.min(3 + (i % 3), supProducts.length);
    const selected = supProducts.slice(0, itemCount);
    let totalAmount = 0;
    let totalQty = 0;
    for (const p of selected) {
      const qty = 20 + (i * 7 % 50);
      const price = p.defaultPrice?.toNumber() || 0;
      const subtotal = qty * price;
      totalAmount += subtotal;
      totalQty += qty;
      await prisma.purchaseOrderItem.create({
        data: {
          purchaseOrderId: po.id,
          productId: p.id,
          expectedQty: qty,
          confirmedQty: status !== PurchaseOrderStatus.PENDING_SUPPLIER ? qty * 0.95 : null,
          deliveredQty: [PurchaseOrderStatus.PARTIAL_DELIVERED, PurchaseOrderStatus.FULLY_DELIVERED, PurchaseOrderStatus.COMPLETED].includes(status)
            ? qty * (status === PurchaseOrderStatus.PARTIAL_DELIVERED ? 0.6 : 1)
            : 0,
          unitPrice: price,
          subtotal,
          expectedDate: poDate.add(1 + (i % 3), 'day').toDate(),
        },
      });
    }
    await prisma.purchaseOrder.update({
      where: { id: po.id },
      data: { totalAmount, totalQty },
    });
  }
  console.log('✅ 创建了 8 个采购单');

  // 9. 创建入库单
  console.log('🚚 创建入库单...');
  const pos = await prisma.purchaseOrder.findMany({
    where: { status: { in: [PurchaseOrderStatus.PARTIAL_DELIVERED, PurchaseOrderStatus.FULLY_DELIVERED, PurchaseOrderStatus.COMPLETED] } },
    include: { items: true },
  });
  const qcUser = await prisma.user.findUnique({ where: { username: 'qc' } });
  const inStatuses = [InboundStatus.QC_PENDING, InboundStatus.QC_PASSED, InboundStatus.COMPLETED];
  let ibIdx = 0;
  for (const po of pos) {
    for (let j = 0; j < (po.status === PurchaseOrderStatus.PARTIAL_DELIVERED ? 1 : 2); j++) {
      const status = inStatuses[ibIdx++ % inStatuses.length];
      const arrivedAt = dayjs(po.createdAt).add(1 + j, 'day');
      const ib = await prisma.inboundOrder.create({
        data: {
          orderNo: `IN${arrivedAt.format('YYYYMMDD')}${String(ibIdx).padStart(3, '0')}`,
          purchaseOrderId: po.id,
          supplierId: po.supplierId,
          status,
          createdById: managerUser.id,
          handledById: status !== InboundStatus.QC_PENDING ? managerUser.id : null,
          qcById: [InboundStatus.QC_PASSED, InboundStatus.COMPLETED].includes(status) ? qcUser.id : null,
          arrivedAt: arrivedAt.toDate(),
          qcAt: [InboundStatus.QC_PASSED, InboundStatus.COMPLETED].includes(status) ? arrivedAt.add(2, 'hour').toDate() : null,
          completedAt: status === InboundStatus.COMPLETED ? arrivedAt.add(3, 'hour').toDate() : null,
          driverName: `司机${ibIdx}`,
          driverPhone: `1390000${String(1000 + ibIdx).padStart(4, '0')}`,
          vehicleNo: `京A·${String(10000 + ibIdx * 7).slice(0, 5)}`,
          temperature: ibIdx % 3 === 0 ? 3.5 : null,
          createdAt: arrivedAt.subtract(30, 'minute').toDate(),
        },
      });
      let totalQty = 0, acceptedQty = 0, rejectedQty = 0;
      const itemsWithPO = po.items.slice(0, Math.min(2, po.items.length));
      for (const poi of itemsWithPO) {
        const actualQty = Math.floor(poi.expectedQty * (0.9 + Math.random() * 0.15));
        const acceptRate = [InboundStatus.QC_PASSED, InboundStatus.COMPLETED].includes(status) ? 0.92 + Math.random() * 0.08 : 1;
        const accept = Math.floor(actualQty * acceptRate);
        const reject = actualQty - accept;
        totalQty += actualQty;
        acceptedQty += accept;
        rejectedQty += reject;
        await prisma.inboundItem.create({
          data: {
            inboundOrderId: ib.id,
            purchaseItemId: poi.id,
            productId: poi.productId,
            expectedQty: poi.expectedQty,
            actualQty,
            acceptedQty: accept,
            rejectedQty: reject,
            rejectReason: reject > 0 ? (ibIdx % 2 === 0 ? '外观不合格，部分损坏' : '温度超标') : null,
            unitPrice: poi.unitPrice,
            shelfLifeCheck: 'OK',
            temperatureOk: true,
            packagingOk: true,
            qcRemark: reject > 0 ? '抽检发现部分异常' : '品质合格',
          },
        });
      }
      await prisma.inboundOrder.update({
        where: { id: ib.id },
        data: { totalQty, acceptedQty, rejectedQty },
      });
    }
  }
  console.log('✅ 创建了入库单及质检记录');

  // 10. 创建出库单
  console.log('📤 创建出库单...');
  const outTypes = ['SALE', 'TRANSFER', 'DONATE', 'SAMPLE'];
  const outStatuses = [OutboundStatus.PENDING, OutboundStatus.PICKING, OutboundStatus.COMPLETED];
  for (let i = 0; i < 6; i++) {
    const status = outStatuses[i % outStatuses.length];
    const created = dayjs().subtract(i, 'day');
    const ob = await prisma.outboundOrder.create({
      data: {
        orderNo: `OUT${created.format('YYYYMMDD')}${String(i + 1).padStart(3, '0')}`,
        outboundType: outTypes[i % outTypes.length],
        referenceNo: `REF${created.format('YYYYMMDD')}${i + 1}`,
        status,
        createdById: managerUser.id,
        handledById: status !== OutboundStatus.PENDING ? managerUser.id : null,
        destination: ['朝阳门店', '海淀店', '通州分仓', '丰台社区店', '大兴配送点', '顺义分拣中心'][i],
        contactPerson: `店长${i + 1}`,
        contactPhone: `138${String(10000000 + i * 137).slice(0, 8)}`,
        pickedAt: status === OutboundStatus.PICKING ? created.add(3, 'hour').toDate() : status === OutboundStatus.COMPLETED ? created.add(2, 'hour').toDate() : null,
        shippedAt: status === OutboundStatus.COMPLETED ? created.add(4, 'hour').toDate() : null,
        completedAt: status === OutboundStatus.COMPLETED ? created.add(6, 'hour').toDate() : null,
        createdAt: created.toDate(),
      },
    });
    const randProds = allProducts.slice(i * 2, i * 2 + 3);
    let totalQty = 0;
    for (const p of randProds) {
      const qty = 10 + ((i * 5 + p.id) % 50);
      totalQty += qty;
      await prisma.outboundItem.create({
        data: {
          outboundOrderId: ob.id,
          productId: p.id,
          requestedQty: qty,
          pickedQty: status !== OutboundStatus.PENDING ? qty : 0,
          shippedQty: status === OutboundStatus.COMPLETED ? qty : 0,
          unitPrice: p.defaultPrice?.toNumber(),
          pickingLocation: `${'ABCD'[i % 4]}区-${String(1 + (p.id % 10)).padStart(2, '0')}-${1 + (i % 5)}`,
        },
      });
    }
    await prisma.outboundOrder.update({
      where: { id: ob.id },
      data: { totalQty, pickedQty: status !== OutboundStatus.PENDING ? totalQty : 0 },
    });
  }
  console.log('✅ 创建了 6 个出库单');

  // 11. 创建异常记录
  console.log('⚠️ 创建异常记录...');
  const allExceptions = await prisma.exceptionRecord.createMany({
    data: [
      {
        exceptionNo: `EXC${dayjs().subtract(3, 'day').format('YYYYMMDD')}001`,
        type: ExceptionType.QC_REJECT,
        title: 'SUP001送货小白菜质量不合格',
        description: '2024-06-15入库的小白菜约15kg出现叶片发黄、腐烂现象，QC抽检不合格。',
        status: ExceptionStatus.RESOLVED,
        priority: 2,
        supplierId: supplier1.id,
        productId: allProducts[0].id,
        createdById: qcUser.id,
        handlerId: managerUser.id,
        lossAmount: 67.5,
        affectedQty: 15,
        resolution: '供应商已补货，损失从下次货款中扣除。',
        resolvedAt: dayjs().subtract(2, 'day').toDate(),
        slaDueAt: dayjs().subtract(1, 'day').toDate(),
        createdAt: dayjs().subtract(3, 'day').toDate(),
      },
      {
        exceptionNo: `EXC${dayjs().subtract(2, 'day').format('YYYYMMDD')}001`,
        type: ExceptionType.NEAR_EXPIRY,
        title: '批次B2024061000001鲜牛奶效期临近',
        description: '批次B2024061000001鲜牛奶还有2天到期，剩余库存48L未转出。',
        status: ExceptionStatus.IN_PROGRESS,
        priority: 3,
        supplierId: supplier5.id,
        productId: allProducts[allProducts.length - 1].id,
        createdById: managerUser.id,
        handlerId: purchaseUser.id,
        affectedQty: 48,
        slaDueAt: dayjs().add(1, 'day').toDate(),
        createdAt: dayjs().subtract(2, 'day').toDate(),
      },
      {
        exceptionNo: `EXC${dayjs().subtract(1, 'day').format('YYYYMMDD')}001`,
        type: ExceptionType.DELIVERY_DELAY,
        title: 'PO20240610004供应商海味鲜未按时到货',
        description: '采购单PO20240610004约定到货日为6月11日，现6月12日仍未送达，且供应商未提前沟通。',
        status: ExceptionStatus.PENDING_SUPPLIER,
        priority: 3,
        supplierId: supplier3.id,
        createdById: purchaseUser.id,
        handlerId: managerUser.id,
        slaDueAt: dayjs().add(6, 'hour').toDate(),
        createdAt: dayjs().subtract(1, 'day').toDate(),
      },
      {
        exceptionNo: `EXC${dayjs().format('YYYYMMDD')}001`,
        type: ExceptionType.SHORT_DELIVERY,
        title: 'SUP002本次送货圣女果少送12kg',
        description: '采购量50kg，实际到货38kg，少送12kg，占订单的24%。',
        status: ExceptionStatus.OPEN,
        priority: 2,
        supplierId: supplier2.id,
        productId: allProducts.find(p => p.sku === 'F004')?.id,
        createdById: managerUser.id,
        affectedQty: 12,
        slaDueAt: dayjs().add(2, 'day').toDate(),
        createdAt: dayjs().subtract(12, 'hour').toDate(),
      },
      {
        exceptionNo: `EXC${dayjs().format('YYYYMMDD')}002`,
        type: ExceptionType.INVENTORY_MISMATCH,
        title: '盘点发现冻虾仁库存差异',
        description: '盘点冻虾仁账面35kg，实际32kg，缺少3kg（可能出库拣货误差）。',
        status: ExceptionStatus.OPEN,
        priority: 1,
        productId: allProducts.find(p => p.sku === 'S004')?.id,
        createdById: managerUser.id,
        handlerId: managerUser.id,
        lossAmount: 165.0,
        affectedQty: 3,
        slaDueAt: dayjs().add(3, 'day').toDate(),
        createdAt: dayjs().subtract(6, 'hour').toDate(),
      },
    ],
  });
  console.log(`✅ 创建了 ${allExceptions.count} 条异常记录`);

  // 12. 创建供应商评分
  console.log('⭐ 创建供应商评分...');
  await prisma.supplierRating.createMany({
    data: [
      { supplierId: supplier1.id, ratedByUserId: managerUser.id, score: 5, onTimeScore: 5, qualityScore: 4, quantityScore: 5, docScore: 5, comment: '整体不错，偶尔少量叶菜品质波动' },
      { supplierId: supplier2.id, ratedByUserId: qcUser.id, score: 4, onTimeScore: 4, qualityScore: 4, quantityScore: 4, docScore: 5, comment: '品质稳定但偶尔会少送' },
      { supplierId: supplier3.id, ratedByUserId: purchaseUser.id, score: 3, onTimeScore: 2, qualityScore: 4, quantityScore: 4, docScore: 3, comment: '到货时间不稳定，需要加强沟通' },
      { supplierId: supplier4.id, ratedByUserId: managerUser.id, score: 4, onTimeScore: 5, qualityScore: 5, quantityScore: 4, docScore: 3 },
      { supplierId: supplier5.id, ratedByUserId: qcUser.id, score: 4, onTimeScore: 4, qualityScore: 4, quantityScore: 4, docScore: 4 },
    ],
  });
  console.log('✅ 创建了供应商评分');

  // 13. 创建补货建议
  console.log('💡 创建补货建议...');
  const lowStockProds = allProducts.slice(0, 5);
  for (const p of lowStockProds) {
    const current = Math.floor(Math.random() * 20) + 5;
    const min = p.minStock.toNumber();
    await prisma.restockSuggestion.create({
      data: {
        productId: p.id,
        currentStock: current,
        minStock: min,
        suggestedQty: Math.max(min - current, 30),
        avgDailyUsage: 8 + Math.floor(Math.random() * 15),
        leadTimeDays: 1,
        supplierId: p.preferredSupplierId,
        status: 'PENDING',
        generatedAt: dayjs().subtract(Math.floor(Math.random() * 2), 'day').toDate(),
      },
    });
  }
  console.log('✅ 创建了补货建议');

  // 14. 创建提醒通知
  console.log('🔔 创建提醒通知...');
  await prisma.alert.createMany({
    data: [
      { type: 'LOW_STOCK', title: '小白菜库存不足', content: '当前库存15kg低于安全库存50kg', status: 'UNREAD', targetUserId: managerUser.id, relatedType: 'PRODUCT', relatedId: allProducts[0].id, createdAt: dayjs().subtract(2, 'hour').toDate() },
      { type: 'NEAR_EXPIRY', title: '鲜牛奶批次效期临近', content: '批次B2024061000001剩余48L，还剩2天到期', status: 'UNREAD', targetUserId: managerUser.id, createdAt: dayjs().subtract(5, 'hour').toDate() },
      { type: 'EXPIRED', title: '批次B2024052000015已过期', content: '批次B2024052000015已过期，建议立即清理', status: 'UNREAD', targetUserId: qcUser.id, createdAt: dayjs().subtract(1, 'day').toDate() },
      { type: 'QC_EXCEPTION', title: '新质检异常', content: '入库单IN20240612002出现不合格品', status: 'READ', targetUserId: managerUser.id, createdAt: dayjs().subtract(1, 'day').toDate() },
      { type: 'SUPPLIER_REPLY', title: '供应商SUP001已回复', content: '采购单PO20240610001已确认，今日14点前送达', status: 'UNREAD', targetUserId: purchaseUser.id, createdAt: dayjs().subtract(1, 'hour').toDate() },
      { type: 'PURCHASE_FOLLOWUP', title: '采购单跟进提醒', content: 'PO20240611003约定今日到货，请确认', status: 'UNREAD', targetUserId: purchaseUser.id, createdAt: dayjs().subtract(30, 'minute').toDate() },
    ],
  });
  console.log('✅ 创建了提醒通知');

  // 15. 创建供应商回复
  console.log('💬 创建供应商回复...');
  const latestPOs = await prisma.purchaseOrder.findMany({ take: 2 });
  const supUsers = await prisma.user.findMany({ where: { role: 'SUPPLIER' } });
  const suppliers = await prisma.supplier.findMany({ take: 3 });
  const firstEx = await prisma.exceptionRecord.findFirst();
  await prisma.supplierReply.createMany({
    data: [
      {
        type: 'PURCHASE_ACK',
        supplierId: suppliers[0]?.id,
        purchaseOrderId: latestPOs[0]?.id,
        fromUserId: supUsers[0].id,
        toUserId: purchaseUser.id,
        subject: `确认采购单 ${latestPOs[0]?.orderNo || ''}`,
        content: '您好，采购单已收到，我们将按要求在今日下午14点前送到B区卸货口。车辆京A·12345，司机王师傅13888888888。',
        status: 'READ',
        createdAt: dayjs().subtract(3, 'hour').toDate(),
      },
      {
        type: 'PURCHASE_ACK',
        supplierId: suppliers[1]?.id,
        purchaseOrderId: latestPOs[1]?.id,
        fromUserId: supUsers[1].id,
        toUserId: purchaseUser.id,
        subject: `关于 ${latestPOs[1]?.orderNo || ''} 的回复`,
        content: '收到采购单。但圣女果目前货源紧张，只能供应约80%的量，其余我们安排明早补送，还请理解。',
        status: 'UNREAD',
        createdAt: dayjs().subtract(1, 'hour').toDate(),
      },
      {
        type: 'EXCEPTION_REPLY',
        supplierId: suppliers[0]?.id,
        exceptionId: firstEx?.id,
        fromUserId: supUsers[0].id,
        toUserId: managerUser.id,
        subject: '关于小白菜质量异常的回复',
        content: '非常抱歉本次出现品质问题，我们已安排今早补发20kg。下次我们加强源头分拣和冷链，避免再发生。',
        status: 'READ',
        createdAt: dayjs().subtract(2, 'day').add(4, 'hour').toDate(),
      },
    ],
  });
  console.log('✅ 创建了供应商回复');

  // 16. 创建批量操作记录
  console.log('📦 创建批量操作记录...');
  await prisma.batchOperation.create({
    data: {
      batchOpNo: `BOP${dayjs().subtract(2, 'day').format('YYYYMMDD')}001`,
      opType: 'BATCH_CREATE_EXCEPTION',
      title: '批量标记临期批次为异常',
      status: 'COMPLETED',
      createdById: managerUser.id,
      totalCount: 6,
      successCount: 6,
      failCount: 0,
      inputData: { factor: 1.05, categoryId: catVegetable.id, nearExpiryDays: 15 },
      resultData: { updatedSku: ['V001', 'V002', 'V003', 'V004', 'V005', 'V006'] },
      confirmedAt: dayjs().subtract(2, 'day').toDate(),
      completedAt: dayjs().subtract(2, 'day').toDate(),
      createdAt: dayjs().subtract(2, 'day').toDate(),
    },
  });
  await prisma.batchOperation.create({
    data: {
      batchOpNo: `BOP${dayjs().subtract(1, 'day').format('YYYYMMDD')}001`,
      opType: 'BATCH_UPDATE_BATCH_STATUS',
      title: '批量标记过期批次状态',
      status: 'PARTIAL_SUCCESS',
      createdById: qcUser.id,
      totalCount: 4,
      successCount: 3,
      failCount: 1,
      inputData: { newStatus: 'EXPIRED', reason: '自然到期' },
      failedItems: [{ batchNo: 'B2024060100008', error: '批次已锁定，无法更新' }],
      remark: '有一个批次关联出库中，暂不能修改',
      confirmedAt: dayjs().subtract(1, 'day').toDate(),
      completedAt: dayjs().subtract(1, 'day').toDate(),
      createdAt: dayjs().subtract(1, 'day').toDate(),
    },
  });
  await prisma.batchOperation.create({
    data: {
      batchOpNo: `BOP${dayjs().format('YYYYMMDD')}001`,
      opType: 'BATCH_UPDATE_BATCH_STATUS',
      title: '批量调整批次状态（待确认）',
      status: 'PENDING_CONFIRM',
      createdById: managerUser.id,
      totalCount: 3,
      successCount: 0,
      failCount: 0,
      inputData: { itemIds: [1, 2, 3], params: { newStatus: 'NEAR_EXPIRY' } },
      createdAt: dayjs().toDate(),
    },
  });
  console.log('✅ 创建了批量操作记录');

  // 17. 创建审计日志
  console.log('📜 创建审计日志...');
  await prisma.auditLog.createMany({
    data: [
      { userId: managerUser.id, action: 'CREATE', entityType: 'PURCHASE_ORDER', entityId: 1, ip: '10.0.0.101', createdAt: dayjs().subtract(8, 'day').toDate() },
      { userId: purchaseUser.id, action: 'UPDATE', entityType: 'PURCHASE_ORDER', entityId: 1, oldValue: { status: 'DRAFT' }, newValue: { status: 'PENDING_SUPPLIER' }, ip: '10.0.0.102', createdAt: dayjs().subtract(8, 'day').add(1, 'hour').toDate() },
      { userId: managerUser.id, action: 'CREATE', entityType: 'INBOUND_ORDER', entityId: 1, ip: '10.0.0.101', createdAt: dayjs().subtract(7, 'day').toDate() },
      { userId: qcUser.id, action: 'QC_APPROVE', entityType: 'INBOUND_ORDER', entityId: 1, ip: '10.0.0.103', createdAt: dayjs().subtract(7, 'day').add(3, 'hour').toDate() },
      { userId: superadmin?.id || managerUser.id, action: 'LOGIN', entityType: 'USER', createdAt: dayjs().subtract(30, 'minute').toDate() },
    ],
  });
  console.log('✅ 初始化数据全部完成！');

  console.log('\n🎉 种子数据加载完成！默认账号如下：');
  console.log('   superadmin / 123456 - 超级管理员');
  console.log('   manager    / 123456 - 仓库主管（推荐使用）');
  console.log('   purchase   / 123456 - 采购员');
  console.log('   qc         / 123456 - 质检员');
  console.log('   viewer     / 123456 - 只读查看');
  console.log('   sup001     / 123456 - 供应商SUP001');
  console.log('   sup002     / 123456 - 供应商SUP002');
  console.log('   sup003     / 123456 - 供应商SUP003');
}

main()
  .then(() => {
    console.log('\n✨ 所有数据初始化成功！');
  })
  .catch((e) => {
    console.error('❌ 初始化数据出错:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
