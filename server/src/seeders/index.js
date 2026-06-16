const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const config = require('../config');

const Store = require('../models/Store');
const User = require('../models/User');
const BusinessData = require('../models/BusinessData');
const Anomaly = require('../models/Anomaly');
const RectificationTask = require('../models/RectificationTask');
const Inventory = require('../models/Inventory');
const MemberCoupon = require('../models/MemberCoupon');
const CashDifference = require('../models/CashDifference');
const dayjs = require('dayjs');

const seedData = async () => {
  try {
    console.log('开始连接数据库...');
    await mongoose.connect(config.mongodbUri);
    console.log('数据库连接成功');

    console.log('清空现有数据...');
    await Promise.all([
      Store.deleteMany({}),
      User.deleteMany({}),
      BusinessData.deleteMany({}),
      Anomaly.deleteMany({}),
      RectificationTask.deleteMany({}),
      Inventory.deleteMany({}),
      MemberCoupon.deleteMany({}),
      CashDifference.deleteMany({})
    ]);

    console.log('创建门店数据...');
    const stores = await Store.create([
      {
        name: '茶飲工坊-总店',
        code: 'ST001',
        address: '北京市朝阳区建国路88号',
        phone: '010-88888888',
        manager: '张经理',
        rentCost: 15000,
        utilityCost: 2000,
        laborCost: 25000,
        targetProfit: 30000,
        status: 'active'
      },
      {
        name: '茶飲工坊-海淀店',
        code: 'ST002',
        address: '北京市海淀区中关村大街1号',
        phone: '010-66666666',
        manager: '李店长',
        rentCost: 12000,
        utilityCost: 1800,
        laborCost: 20000,
        targetProfit: 25000,
        status: 'active'
      },
      {
        name: '茶飲工坊-西城店',
        code: 'ST003',
        address: '北京市西城区金融街10号',
        phone: '010-77777777',
        manager: '王店长',
        rentCost: 18000,
        utilityCost: 2200,
        laborCost: 28000,
        targetProfit: 35000,
        status: 'active'
      }
    ]);

    console.log('创建用户数据...');
    const hashedPassword = await bcrypt.hash('123456', 10);
    const users = await User.create([
      {
        username: 'admin',
        password: '123456',
        name: '系统管理员',
        role: 'admin',
        email: 'admin@teastore.com',
        phone: '13800000000',
        status: 'active',
        permissions: ['all']
      },
      {
        username: 'manager1',
        password: '123456',
        name: '张经理',
        role: 'manager',
        email: 'manager@teastore.com',
        phone: '13800000001',
        status: 'active',
        permissions: ['store:read', 'user:read', 'business:*', 'anomaly:*', 'rectification:*']
      },
      {
        username: 'store1',
        password: '123456',
        name: '李店长',
        role: 'store_manager',
        store: stores[0]._id,
        email: 'store1@teastore.com',
        phone: '13800000002',
        status: 'active',
        permissions: ['business:*', 'anomaly:*', 'inventory:*']
      },
      {
        username: 'staff1',
        password: '123456',
        name: '店员小王',
        role: 'staff',
        store: stores[0]._id,
        email: 'staff1@teastore.com',
        phone: '13800000003',
        status: 'active',
        permissions: ['business:read', 'inventory:read']
      }
    ]);

    console.log('创建营业数据...');
    const today = dayjs();
    const businessDataList = [];
    for (let i = 0; i < 30; i++) {
      const date = today.subtract(i, 'day').toDate();
      for (const store of stores) {
        const sales = Math.floor(Math.random() * 3000) + 2000;
        const orders = Math.floor(Math.random() * 200) + 100;
        const costOfGoods = Math.floor(sales * 0.3);
        const laborCost = Math.floor(sales * 0.25);
        businessDataList.push({
          store: store._id,
          date,
          totalSales: sales,
          orderCount: orders,
          memberSales: Math.floor(sales * 0.4),
          takeoutSales: Math.floor(sales * 0.3),
          dineInSales: Math.floor(sales * 0.3),
          costOfGoods,
          laborCost,
          rentCost: Math.floor(store.rentCost / 30),
          utilityCost: Math.floor(store.utilityCost / 30),
          otherCost: Math.floor(Math.random() * 100),
          weather: ['晴', '阴', '雨'][Math.floor(Math.random() * 3)],
          notes: '',
          createdBy: users[2]._id
        });
      }
    }
    await BusinessData.create(businessDataList);

    console.log('创建异常记录...');
    const anomalies = await Anomaly.create([
      {
        store: stores[0]._id,
        type: 'hygiene',
        level: 'moderate',
        title: '操作台清洁不到位',
        description: '操作台有茶渍，需要加强清洁',
        location: '前厅操作台',
        status: 'reported',
        reportedBy: users[2]._id,
        impactOnProfit: 0
      },
      {
        store: stores[0]._id,
        type: 'inventory',
        level: 'major',
        title: '珍珠库存不足',
        description: '珍珠库存低于安全线，可能影响销售',
        location: '冷藏室',
        status: 'in_progress',
        reportedBy: users[3]._id,
        impactOnProfit: -200
      },
      {
        store: stores[1]._id,
        type: 'equipment',
        level: 'minor',
        title: '封口机故障',
        description: '封口机温度不稳定，需要维修',
        location: '出餐区',
        status: 'resolved',
        reportedBy: users[1]._id,
        resolvedBy: users[1]._id,
        resolution: '已联系售后维修，更换加热丝',
        impactOnProfit: -500
      }
    ]);

    console.log('创建整改任务...');
    const rectTasks = await RectificationTask.create([
      {
        store: stores[0]._id,
        taskNo: 'RT202401001',
        title: '后厨卫生整改',
        description: '按照卫生检查标准，对后厨进行全面清洁整理',
        type: 'hygiene',
        priority: 'high',
        status: 'in_progress',
        assignedTo: users[2]._id,
        assignedBy: users[0]._id,
        dueDate: today.add(3, 'day').toDate(),
        relatedAnomaly: null,
        impactOnProfit: 0,
        profitNote: ''
      },
      {
        store: stores[0]._id,
        taskNo: 'RT202401002',
        title: '员工服务培训',
        description: '针对服务态度问题进行专项培训',
        type: 'service',
        priority: 'medium',
        status: 'pending',
        assignedTo: users[2]._id,
        assignedBy: users[1]._id,
        dueDate: today.add(7, 'day').toDate(),
        impactOnProfit: 0
      },
      {
        store: stores[1]._id,
        taskNo: 'RT202401003',
        title: '设备日常维护',
        description: '对制冰机、封口机等设备进行常规维护',
        type: 'equipment',
        priority: 'low',
        status: 'approved',
        assignedTo: users[2]._id,
        assignedBy: users[0]._id,
        dueDate: today.subtract(2, 'day').toDate(),
        submissionNote: '已完成全部设备的清洁和维护',
        submittedAt: today.subtract(1, 'day').toDate(),
        reviewNote: '维护工作完成良好',
        reviewedBy: users[1]._id,
        reviewedAt: today.subtract(1, 'day').toDate(),
        impactOnProfit: 0
      }
    ]);

    console.log('创建库存数据...');
    const inventoryItems = await Inventory.create([
      {
        store: stores[0]._id,
        name: '绿茶叶',
        sku: 'INV001',
        category: 'tea_leaf',
        unit: '斤',
        quantity: 50,
        unitPrice: 80,
        minStock: 20,
        maxStock: 100,
        expiryDate: today.add(6, 'month').toDate(),
        location: '干货区A1',
        createdBy: users[2]._id
      },
      {
        store: stores[0]._id,
        name: '珍珠粉圆',
        sku: 'INV002',
        category: 'topping',
        unit: '箱',
        quantity: 5,
        unitPrice: 120,
        minStock: 10,
        maxStock: 50,
        expiryDate: today.add(3, 'month').toDate(),
        location: '干货区B2',
        createdBy: users[2]._id
      },
      {
        store: stores[0]._id,
        name: '鲜奶',
        sku: 'INV003',
        category: 'milk',
        unit: '箱',
        quantity: 15,
        unitPrice: 60,
        minStock: 10,
        maxStock: 30,
        expiryDate: today.add(7, 'day').toDate(),
        location: '冷藏区1号',
        createdBy: users[2]._id
      },
      {
        store: stores[0]._id,
        name: '果糖',
        sku: 'INV004',
        category: 'sugar',
        unit: '桶',
        quantity: 3,
        unitPrice: 200,
        minStock: 5,
        maxStock: 20,
        expiryDate: today.add(12, 'month').toDate(),
        location: '干货区C1',
        createdBy: users[2]._id
      },
      {
        store: stores[0]._id,
        name: '杯子(中)',
        sku: 'INV005',
        category: 'packaging',
        unit: '箱',
        quantity: 200,
        unitPrice: 45,
        minStock: 50,
        maxStock: 500,
        expiryDate: today.add(24, 'month').toDate(),
        location: '包材区',
        createdBy: users[2]._id
      }
    ]);

    console.log('创建会员券包数据...');
    const coupons = await MemberCoupon.create([
      {
        store: stores[0]._id,
        name: '新人立减券',
        type: 'cash',
        value: 5,
        minSpend: 20,
        totalCount: 500,
        usedCount: 120,
        remainingCount: 380,
        validFrom: today.subtract(7, 'day').toDate(),
        validTo: today.add(30, 'day').toDate(),
        status: 'active',
        description: '新用户专享立减5元',
        distributionMethod: 'auto',
        reminderDays: 3,
        createdBy: users[1]._id
      },
      {
        store: stores[0]._id,
        name: '买二送一券',
        type: 'gift',
        value: 15,
        minSpend: 30,
        totalCount: 200,
        usedCount: 180,
        remainingCount: 20,
        validFrom: today.subtract(15, 'day').toDate(),
        validTo: today.add(5, 'day').toDate(),
        status: 'active',
        description: '购买两杯送一杯指定饮品',
        distributionMethod: 'event',
        reminderDays: 3,
        createdBy: users[1]._id
      },
      {
        store: stores[1]._id,
        name: '八折优惠券',
        type: 'discount',
        value: 80,
        minSpend: 0,
        totalCount: 1000,
        usedCount: 50,
        remainingCount: 950,
        validFrom: today.toDate(),
        validTo: today.add(60, 'day').toDate(),
        status: 'active',
        description: '全场饮品八折',
        distributionMethod: 'manual',
        reminderDays: 7,
        createdBy: users[1]._id
      }
    ]);

    console.log('创建现金差异数据...');
    const cashDiffs = await CashDifference.create([
      {
        store: stores[0]._id,
        date: today.subtract(1, 'day').toDate(),
        shift: 'all_day',
        expectedCash: 2580,
        actualCash: 2575,
        difference: -5,
        differenceType: 'short',
        reason: 'change_error',
        note: '找零时少找了5元',
        handlingResult: 'adjusted',
        handlingNote: '已在备用金中扣除',
        impactOnProfit: -5,
        handledBy: users[2]._id,
        handledAt: today.subtract(1, 'day').toDate(),
        recordedBy: users[3]._id
      },
      {
        store: stores[0]._id,
        date: today.subtract(3, 'day').toDate(),
        shift: 'morning',
        expectedCash: 890,
        actualCash: 895,
        difference: 5,
        differenceType: 'over',
        reason: 'other',
        note: '收银机多了5元，原因不明',
        handlingResult: 'investigated',
        handlingNote: '已记录，待进一步核实',
        impactOnProfit: 0,
        handledBy: users[2]._id,
        handledAt: today.subtract(2, 'day').toDate(),
        recordedBy: users[3]._id
      },
      {
        store: stores[1]._id,
        date: today.subtract(2, 'day').toDate(),
        shift: 'evening',
        expectedCash: 1200,
        actualCash: 1180,
        difference: -20,
        differenceType: 'short',
        reason: 'refund',
        note: '顾客退款20元',
        handlingResult: 'pending',
        recordedBy: users[2]._id
      }
    ]);

    console.log('种子数据创建完成!');
    console.log('========================================');
    console.log('管理员账号: admin / 123456');
    console.log('经理账号: manager1 / 123456');
    console.log('店长账号: store1 / 123456');
    console.log('店员账号: staff1 / 123456');
    console.log('========================================');

    process.exit(0);
  } catch (error) {
    console.error('种子数据创建失败:', error);
    process.exit(1);
  }
};

seedData();
