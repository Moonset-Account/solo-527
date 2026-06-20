require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const config = require('../config');

const {
  Service,
  PricingRule,
  Technician,
  Part,
  Order,
  Satisfaction,
  User,
  Refund,
  RescheduleRecord
} = require('../models');

async function seed() {
  try {
    await mongoose.connect(config.mongodbUri);
    console.log('MongoDB 连接成功');
    
    console.log('清空现有数据...');
    await Promise.all([
      Service.deleteMany({}),
      PricingRule.deleteMany({}),
      Technician.deleteMany({}),
      Part.deleteMany({}),
      Order.deleteMany({}),
      Satisfaction.deleteMany({}),
      User.deleteMany({}),
      Refund.deleteMany({}),
      RescheduleRecord.deleteMany({})
    ]);
    
    console.log('创建管理员用户...');
    const adminPassword = await bcrypt.hash('admin123', 10);
    const admin = new User({
      username: 'admin',
      password: 'admin123',
      name: '系统管理员',
      phone: '13800138000',
      email: 'admin@example.com',
      role: 'super_admin',
      store: '总部',
      status: 'active'
    });
    await admin.save();
    
    const csPassword = await bcrypt.hash('cs123456', 10);
    const cs = new User({
      username: 'cs001',
      password: 'cs123456',
      name: '张客服',
      phone: '13800138001',
      role: 'customer_service',
      store: '朝阳门店',
      status: 'active'
    });
    await cs.save();
    
    console.log('创建服务项...');
    const services = [
      { name: '空调清洗', category: '空调', description: '空调深度清洗服务', basePrice: 128, serviceFee: 30, duration: 60, warrantyDays: 30, sortOrder: 1 },
      { name: '空调加氟', category: '空调', description: '空调制冷剂补充', basePrice: 150, serviceFee: 30, duration: 45, warrantyDays: 90, sortOrder: 2 },
      { name: '空调维修', category: '空调', description: '空调故障检修', basePrice: 80, serviceFee: 50, duration: 90, warrantyDays: 90, sortOrder: 3 },
      { name: '空调安装', category: '空调', description: '空调新机安装', basePrice: 200, serviceFee: 0, duration: 120, warrantyDays: 180, sortOrder: 4 },
      { name: '冰箱清洗', category: '冰箱', description: '冰箱深度清洁消毒', basePrice: 98, serviceFee: 30, duration: 60, warrantyDays: 30, sortOrder: 1 },
      { name: '冰箱维修', category: '冰箱', description: '冰箱故障检修', basePrice: 100, serviceFee: 50, duration: 90, warrantyDays: 90, sortOrder: 2 },
      { name: '洗衣机清洗', category: '洗衣机', description: '洗衣机内筒深度清洗', basePrice: 88, serviceFee: 30, duration: 60, warrantyDays: 30, sortOrder: 1 },
      { name: '洗衣机维修', category: '洗衣机', description: '洗衣机故障检修', basePrice: 90, serviceFee: 50, duration: 90, warrantyDays: 90, sortOrder: 2 },
      { name: '电视安装', category: '电视', description: '电视挂架安装', basePrice: 120, serviceFee: 0, duration: 60, warrantyDays: 90, sortOrder: 1 },
      { name: '电视维修', category: '电视', description: '电视故障检修', basePrice: 120, serviceFee: 50, duration: 90, warrantyDays: 90, sortOrder: 2 },
      { name: '热水器清洗', category: '热水器', description: '热水器除垢清洗', basePrice: 108, serviceFee: 30, duration: 60, warrantyDays: 30, sortOrder: 1 },
      { name: '热水器维修', category: '热水器', description: '热水器故障检修', basePrice: 100, serviceFee: 50, duration: 90, warrantyDays: 90, sortOrder: 2 }
    ];
    
    const createdServices = await Service.insertMany(services);
    console.log(`创建了 ${createdServices.length} 个服务项`);
    
    console.log('创建加价规则...');
    const pricingRules = [
      {
        name: '晚间服务费',
        ruleType: 'time_slot',
        description: '晚上18:00-22:00加收服务费',
        priceType: 'fixed',
        value: 50,
        priority: 10,
        status: 'active',
        timeSlots: [
          { dayOfWeek: 1, startTime: '18:00', endTime: '22:00', value: 50, priceType: 'fixed' },
          { dayOfWeek: 2, startTime: '18:00', endTime: '22:00', value: 50, priceType: 'fixed' },
          { dayOfWeek: 3, startTime: '18:00', endTime: '22:00', value: 50, priceType: 'fixed' },
          { dayOfWeek: 4, startTime: '18:00', endTime: '22:00', value: 50, priceType: 'fixed' },
          { dayOfWeek: 5, startTime: '18:00', endTime: '22:00', value: 50, priceType: 'fixed' }
        ]
      },
      {
        name: '周末加价',
        ruleType: 'time_slot',
        description: '周六周日加收服务费',
        priceType: 'percentage',
        value: 20,
        priority: 15,
        status: 'active',
        timeSlots: [
          { dayOfWeek: 6, startTime: '08:00', endTime: '22:00', value: 20, priceType: 'percentage' },
          { dayOfWeek: 0, startTime: '08:00', endTime: '22:00', value: 20, priceType: 'percentage' }
        ]
      },
      {
        name: '加急费',
        ruleType: 'urgent',
        description: '加急服务加收费用',
        priceType: 'percentage',
        value: 30,
        priority: 20,
        status: 'active'
      },
      {
        name: '紧急上门',
        ruleType: 'urgent',
        description: '紧急上门服务（2小时内）',
        priceType: 'fixed',
        value: 100,
        priority: 25,
        status: 'active'
      },
      {
        name: '距离加价',
        ruleType: 'distance',
        description: '超出5公里后每公里加收',
        priceType: 'tiered',
        priority: 5,
        status: 'active',
        tieredRules: [
          { min: 0, max: 5, value: 0, priceType: 'fixed' },
          { min: 5, max: 10, value: 30, priceType: 'fixed' },
          { min: 10, max: 20, value: 60, priceType: 'fixed' },
          { min: 20, max: null, value: 100, priceType: 'fixed' }
        ]
      },
      {
        name: '难度加价',
        ruleType: 'difficulty',
        description: '高难度维修加价',
        priceType: 'percentage',
        value: 30,
        priority: 8,
        status: 'active'
      }
    ];
    
    const createdRules = await PricingRule.insertMany(pricingRules);
    console.log(`创建了 ${createdRules.length} 条加价规则`);
    
    console.log('创建师傅...');
    const technicians = [
      { name: '李师傅', phone: '13900139001', level: '高级', skillCategories: ['空调', '冰箱'], baseSalary: 5000, commissionRate: 20, serviceFee: 50, hourlyRate: 80, store: '朝阳门店', status: 'on_duty', rating: 4.8, totalOrders: 256, completedOrders: 245, workArea: '朝阳区' },
      { name: '王师傅', phone: '13900139002', level: '高级', skillCategories: ['空调', '洗衣机', '热水器'], baseSalary: 4800, commissionRate: 18, serviceFee: 50, hourlyRate: 75, store: '朝阳门店', status: 'on_duty', rating: 4.6, totalOrders: 189, completedOrders: 180, workArea: '朝阳区、东城区' },
      { name: '张师傅', phone: '13900139003', level: '中级', skillCategories: ['电视', '洗衣机'], baseSalary: 4000, commissionRate: 15, serviceFee: 40, hourlyRate: 60, store: '海淀门店', status: 'on_duty', rating: 4.5, totalOrders: 120, completedOrders: 115, workArea: '海淀区' },
      { name: '刘师傅', phone: '13900139004', level: '专家', skillCategories: ['空调', '冰箱', '洗衣机', '热水器'], baseSalary: 6000, commissionRate: 25, serviceFee: 80, hourlyRate: 100, store: '朝阳门店', status: 'busy', rating: 4.9, totalOrders: 500, completedOrders: 489, workArea: '全市' },
      { name: '陈师傅', phone: '13900139005', level: '初级', skillCategories: ['燃气灶', '油烟机'], baseSalary: 3500, commissionRate: 12, serviceFee: 30, hourlyRate: 50, store: '海淀门店', status: 'off_duty', rating: 4.2, totalOrders: 45, completedOrders: 42, workArea: '海淀区' }
    ];
    
    const createdTechnicians = await Technician.insertMany(technicians);
    console.log(`创建了 ${createdTechnicians.length} 位师傅`);
    
    console.log('创建配件...');
    const parts = [
      { name: '空调压缩机', sku: 'PART-AC-001', category: '空调配件', brand: '美的', model: 'KFR-26W', specification: '1.5匹', unit: '个', costPrice: 280, salePrice: 450, stock: 15, minStock: 5, warrantyMonths: 12, supplier: '美的授权经销商' },
      { name: '空调电容', sku: 'PART-AC-002', category: '空调配件', brand: '格力', model: 'CBB65', specification: '35uf', unit: '个', costPrice: 25, salePrice: 50, stock: 50, minStock: 10, warrantyMonths: 6, supplier: '格力配件中心' },
      { name: '空调遥控器', sku: 'PART-AC-003', category: '空调配件', brand: '通用', model: '万能', specification: '万能型', unit: '个', costPrice: 15, salePrice: 35, stock: 30, minStock: 5, warrantyMonths: 3, supplier: '电子配件城' },
      { name: '冰箱温控器', sku: 'PART-FR-001', category: '冰箱配件', brand: '海尔', model: 'WDF28', specification: '-10~10度', unit: '个', costPrice: 35, salePrice: 70, stock: 20, minStock: 5, warrantyMonths: 6, supplier: '海尔配件中心' },
      { name: '冰箱压缩机', sku: 'PART-FR-002', category: '冰箱配件', brand: '海尔', model: 'HYZ-66', specification: '180L', unit: '个', costPrice: 350, salePrice: 580, stock: 8, minStock: 3, warrantyMonths: 12, supplier: '海尔授权经销商' },
      { name: '洗衣机电机', sku: 'PART-WM-001', category: '洗衣机配件', brand: '小天鹅', model: 'XD-180', specification: '180W', unit: '个', costPrice: 180, salePrice: 320, stock: 12, minStock: 3, warrantyMonths: 12, supplier: '小天鹅配件中心' },
      { name: '洗衣机皮带', sku: 'PART-WM-002', category: '洗衣机配件', brand: '通用', model: 'O型', specification: '500mm', unit: '条', costPrice: 8, salePrice: 20, stock: 100, minStock: 20, warrantyMonths: 3, supplier: '电子配件城' },
      { name: '电视挂架', sku: 'PART-TV-001', category: '电视配件', brand: '乐歌', model: 'PSW798', specification: '32-65寸', unit: '个', costPrice: 45, salePrice: 99, stock: 25, minStock: 5, warrantyMonths: 24, supplier: '乐歌经销商' },
      { name: '热水器加热管', sku: 'PART-WH-001', category: '热水器配件', brand: '史密斯', model: 'EWH-50', specification: '2000W', unit: '根', costPrice: 55, salePrice: 110, stock: 15, minStock: 5, warrantyMonths: 6, supplier: '史密斯配件中心' },
      { name: '热水器镁棒', sku: 'PART-WH-002', category: '热水器配件', brand: '通用', model: '标准型', specification: '20cm', unit: '根', costPrice: 18, salePrice: 45, stock: 40, minStock: 10, warrantyMonths: 12, supplier: '五金配件批发' }
    ];
    
    const createdParts = await Part.insertMany(parts);
    console.log(`创建了 ${createdParts.length} 个配件`);
    
    console.log('创建示例订单...');
    const now = new Date();
    const orders = [
      {
        customerName: '张三',
        customerPhone: '13600136001',
        customerAddress: '朝阳区建国路88号',
        store: '朝阳门店',
        customerService: '张客服',
        applianceType: '空调',
        applianceBrand: '格力',
        applianceModel: 'KFR-35GW',
        faultDescription: '空调不制冷，需要检查',
        appointmentTime: new Date(now.getTime() + 24 * 60 * 60 * 1000),
        urgencyLevel: 'normal',
        status: 'pending',
        serviceItems: [{ serviceName: '空调维修', basePrice: 80, quantity: 1, subtotal: 80 }],
        baseAmount: 80,
        serviceFee: 50,
        totalAmount: 130,
        pricingBreakdown: [
          { type: 'service', name: '基础服务费', amount: 80, description: '维修服务基础费用' },
          { type: 'service_fee', name: '上门服务费', amount: 50, description: '师傅上门费用' }
        ]
      },
      {
        customerName: '李四',
        customerPhone: '13600136002',
        customerAddress: '海淀区中关村大街1号',
        store: '海淀门店',
        customerService: '王客服',
        applianceType: '洗衣机',
        applianceBrand: '海尔',
        applianceModel: 'XQG70',
        faultDescription: '洗衣机不脱水，有异响',
        appointmentTime: new Date(now.getTime() + 48 * 60 * 60 * 1000),
        urgencyLevel: 'urgent',
        status: 'assigned',
        technicianId: createdTechnicians[2]._id,
        technicianName: '张师傅',
        technicianFee: 40,
        serviceItems: [{ serviceName: '洗衣机维修', basePrice: 90, quantity: 1, subtotal: 90 }],
        baseAmount: 90,
        serviceFee: 50,
        totalAmount: 207,
        additionalFees: [{ type: 'urgent', name: '加急费', amount: 27, description: '加急服务' }],
        pricingBreakdown: [
          { type: 'service', name: '基础服务费', amount: 90, description: '维修服务基础费用' },
          { type: 'service_fee', name: '上门服务费', amount: 50, description: '师傅上门费用' },
          { type: 'urgent', name: '加急费', amount: 27, description: '加急服务' }
        ]
      },
      {
        customerName: '王五',
        customerPhone: '13600136003',
        customerAddress: '朝阳区望京SOHO',
        store: '朝阳门店',
        customerService: '张客服',
        applianceType: '空调',
        applianceBrand: '美的',
        applianceModel: 'KFR-26GW',
        faultDescription: '定期清洗保养',
        appointmentTime: new Date(now.getTime() - 24 * 60 * 60 * 1000),
        urgencyLevel: 'normal',
        status: 'completed',
        technicianId: createdTechnicians[0]._id,
        technicianName: '李师傅',
        technicianFee: 50,
        serviceItems: [{ serviceName: '空调清洗', basePrice: 128, quantity: 1, subtotal: 128 }],
        parts: [
          { partId: createdParts[2]._id, partName: '空调遥控器', partSku: 'PART-AC-003', quantity: 1, unitPrice: 35, costPrice: 15, subtotal: 35 }
        ],
        baseAmount: 128,
        partsAmount: 35,
        serviceFee: 30,
        technicianFee: 50,
        totalAmount: 243,
        paymentStatus: 'paid',
        paymentMethod: 'wechat',
        actualStartTime: new Date(now.getTime() - 24 * 60 * 60 * 1000 + 30 * 60 * 1000),
        actualEndTime: new Date(now.getTime() - 24 * 60 * 60 * 1000 + 90 * 60 * 1000),
        diagnosisResult: '正常保养',
        repairNotes: '清洗完成，更换了遥控器电池',
        pricingBreakdown: [
          { type: 'service', name: '基础服务费', amount: 128, description: '空调清洗' },
          { type: 'service_fee', name: '上门服务费', amount: 30, description: '师傅上门费用' },
          { type: 'technician', name: '师傅服务费', amount: 50, description: '李师傅' },
          { type: 'parts', name: '配件费用', amount: 35, description: '空调遥控器' }
        ]
      },
      {
        customerName: '赵六',
        customerPhone: '13600136004',
        customerAddress: '东城区王府井大街',
        store: '朝阳门店',
        customerService: '张客服',
        applianceType: '冰箱',
        applianceBrand: '海尔',
        applianceModel: 'BCD-256',
        faultDescription: '冰箱不制冷，有嗡嗡声',
        appointmentTime: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
        urgencyLevel: 'urgent',
        status: 'completed',
        technicianId: createdTechnicians[3]._id,
        technicianName: '刘师傅',
        technicianFee: 80,
        serviceItems: [{ serviceName: '冰箱维修', basePrice: 100, quantity: 1, subtotal: 100 }],
        parts: [
          { partId: createdParts[3]._id, partName: '冰箱温控器', partSku: 'PART-FR-001', quantity: 1, unitPrice: 70, costPrice: 35, subtotal: 70 }
        ],
        baseAmount: 100,
        partsAmount: 70,
        serviceFee: 50,
        technicianFee: 80,
        totalAmount: 351,
        additionalFees: [{ type: 'urgent', name: '加急费', amount: 51, description: '加急服务' }],
        paymentStatus: 'paid',
        paymentMethod: 'alipay',
        actualStartTime: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
        actualEndTime: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000 + 3.5 * 60 * 60 * 1000),
        diagnosisResult: '温控器损坏',
        repairNotes: '更换温控器后恢复正常',
        pricingBreakdown: [
          { type: 'service', name: '基础服务费', amount: 100, description: '冰箱维修' },
          { type: 'service_fee', name: '上门服务费', amount: 50, description: '师傅上门费用' },
          { type: 'technician', name: '师傅服务费', amount: 80, description: '刘师傅(专家)' },
          { type: 'parts', name: '配件费用', amount: 70, description: '冰箱温控器' },
          { type: 'urgent', name: '加急费', amount: 51, description: '加急服务30%' }
        ]
      },
      {
        customerName: '孙七',
        customerPhone: '13600136005',
        customerAddress: '丰台区南三环',
        store: '朝阳门店',
        customerService: '张客服',
        applianceType: '热水器',
        applianceBrand: '史密斯',
        applianceModel: 'EWH-50',
        faultDescription: '热水器出水小，需要清洗',
        appointmentTime: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
        urgencyLevel: 'normal',
        status: 'completed',
        technicianId: createdTechnicians[1]._id,
        technicianName: '王师傅',
        technicianFee: 50,
        serviceItems: [{ serviceName: '热水器清洗', basePrice: 108, quantity: 1, subtotal: 108 }],
        parts: [
          { partId: createdParts[9]._id, partName: '热水器镁棒', partSku: 'PART-WH-002', quantity: 1, unitPrice: 45, costPrice: 18, subtotal: 45 }
        ],
        baseAmount: 108,
        partsAmount: 45,
        serviceFee: 30,
        technicianFee: 50,
        totalAmount: 233,
        paymentStatus: 'paid',
        paymentMethod: 'cash',
        actualStartTime: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000 + 1.5 * 60 * 60 * 1000),
        actualEndTime: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000 + 2.5 * 60 * 60 * 1000),
        diagnosisResult: '水垢较多，镁棒消耗',
        repairNotes: '除垢清洗，更换镁棒',
        pricingBreakdown: [
          { type: 'service', name: '基础服务费', amount: 108, description: '热水器清洗' },
          { type: 'service_fee', name: '上门服务费', amount: 30, description: '师傅上门费用' },
          { type: 'technician', name: '师傅服务费', amount: 50, description: '王师傅' },
          { type: 'parts', name: '配件费用', amount: 45, description: '热水器镁棒' }
        ]
      }
    ];
    
    const createdOrders = await Order.insertMany(orders);
    console.log(`创建了 ${createdOrders.length} 个订单`);
    
    console.log('创建满意度评价...');
    const satisfactions = [
      {
        orderId: createdOrders[2]._id,
        orderNo: createdOrders[2].orderNo,
        customerName: '王五',
        customerPhone: '13600136003',
        overallRating: 5,
        serviceQuality: 5,
        technicianAttitude: 5,
        priceSatisfaction: 4,
        responseSpeed: 5,
        positiveComments: '师傅很专业，清洗很干净',
        willRecommend: true,
        technicianId: createdTechnicians[0]._id,
        technicianName: '李师傅',
        store: '朝阳门店',
        customerService: '张客服',
        visitStatus: 'visited',
        visitor: '张客服',
        visitTime: new Date(now.getTime() - 23 * 60 * 60 * 1000),
        visitRemark: '客户很满意，无其他问题',
        followUpStatus: 'resolved',
        surveySource: 'wechat'
      },
      {
        orderId: createdOrders[3]._id,
        orderNo: createdOrders[3].orderNo,
        customerName: '赵六',
        customerPhone: '13600136004',
        overallRating: 4,
        serviceQuality: 4,
        technicianAttitude: 5,
        priceSatisfaction: 3,
        responseSpeed: 5,
        positiveComments: '师傅很专业，维修速度快',
        negativeComments: '价格有点贵',
        willRecommend: true,
        technicianId: createdTechnicians[3]._id,
        technicianName: '刘师傅',
        store: '朝阳门店',
        customerService: '张客服',
        visitStatus: 'visited',
        visitor: '张客服',
        visitTime: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
        visitRemark: '客户对价格有点意见，但总体满意',
        badReviewReason: 'price_issue',
        badReviewDetail: '客户觉得配件价格偏高',
        followUpStatus: 'followed',
        followUpRemark: '已解释价格构成，客户表示理解',
        followUpTime: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
        followUpBy: '张客服',
        surveySource: 'phone'
      },
      {
        orderId: createdOrders[4]._id,
        orderNo: createdOrders[4].orderNo,
        customerName: '孙七',
        customerPhone: '13600136005',
        overallRating: 2,
        serviceQuality: 2,
        technicianAttitude: 3,
        priceSatisfaction: 2,
        responseSpeed: 3,
        negativeComments: '清洗不干净，还有异味',
        suggestions: '希望加强服务质量',
        willRecommend: false,
        technicianId: createdTechnicians[1]._id,
        technicianName: '王师傅',
        store: '朝阳门店',
        customerService: '张客服',
        visitStatus: 'pending',
        badReviewReason: 'service_quality',
        badReviewDetail: '清洗效果不好，客户不满意',
        followUpStatus: 'not_followed',
        surveySource: 'wechat'
      }
    ];
    
    const createdSatisfactions = await Satisfaction.insertMany(satisfactions);
    console.log(`创建了 ${createdSatisfactions.length} 条满意度评价`);
    
    console.log('种子数据创建完成！');
    console.log('');
    console.log('测试账号：');
    console.log('  管理员: admin / admin123');
    console.log('  客服: cs001 / cs123456');
    
    process.exit(0);
  } catch (error) {
    console.error('种子数据创建失败:', error);
    process.exit(1);
  }
}

seed();
