require('dotenv').config();
const sequelize = require('../config/database');
const { User, Tool, Borrow, Maintenance, AuditLog, Notification } = require('../models');

const seedDatabase = async () => {
  try {
    console.log('开始同步数据库...');
    await sequelize.sync({ force: true });
    console.log('数据库同步完成');

    console.log('创建种子用户...');
    const admin = await User.create({
      username: 'admin',
      password: 'admin123',
      realName: '系统管理员',
      phone: '13800138000',
      idCard: '110101199001010001',
      role: 'admin',
      verified: true,
      balance: 1000
    });

    const volunteer = await User.create({
      username: 'volunteer',
      password: 'volunteer123',
      realName: '社区志愿者',
      phone: '13800138001',
      idCard: '110101199001010002',
      role: 'volunteer',
      verified: true,
      balance: 500
    });

    const resident1 = await User.create({
      username: 'resident1',
      password: 'resident123',
      realName: '张三',
      phone: '13800138002',
      idCard: '110101199001010003',
      role: 'resident',
      verified: true,
      balance: 200
    });

    const resident2 = await User.create({
      username: 'resident2',
      password: 'resident123',
      realName: '李四',
      phone: '13800138003',
      idCard: '110101199001010004',
      role: 'resident',
      verified: false,
      balance: 100
    });

    console.log('创建种子工具...');
    const toolsData = [
      { name: '博世电钻', category: '电动工具', description: '家用多功能电钻，带多种钻头', deposit: 50, isValuable: false, location: '社区服务中心A柜', image: null },
      { name: '折叠梯子', category: '登高工具', description: '3米铝合金折叠梯', deposit: 30, isValuable: false, location: '社区服务中心B柜', image: null },
      { name: '露营桌椅套装', category: '户外用品', description: '一桌四椅便携套装', deposit: 80, isValuable: false, location: '社区服务中心C柜', image: null },
      { name: '专业冲击钻', category: '电动工具', description: '工业级冲击钻，适合混凝土作业', deposit: 200, isValuable: true, location: '社区服务中心贵重物品柜', image: null },
      { name: '手推车', category: '搬运工具', description: '平板手推车，承重150kg', deposit: 40, isValuable: false, location: '社区服务中心车库', image: null },
      { name: '高压水枪', category: '清洁工具', description: '家用高压清洗水枪', deposit: 60, isValuable: false, location: '社区服务中心D柜', image: null },
      { name: '烧烤炉', category: '户外用品', description: '便携式炭烤烧烤炉', deposit: 50, isValuable: false, location: '社区服务中心C柜', image: null },
      { name: '专业相机套装', category: '数码设备', description: '佳能单反相机+镜头', deposit: 500, isValuable: true, location: '社区服务中心贵重物品柜', image: null },
      { name: '卷尺套装', category: '测量工具', description: '5米+10米卷尺各一把', deposit: 10, isValuable: false, location: '社区服务中心A柜', image: null },
      { name: '急救箱', category: '医疗用品', description: '家庭急救箱，含常用药品', deposit: 0, isValuable: false, location: '社区服务中心前台', image: null }
    ];

    const tools = [];
    for (const toolData of toolsData) {
      const tool = await Tool.create({
        ...toolData,
        qrCode: `TOOL-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        status: 'available',
        totalBorrows: Math.floor(Math.random() * 20)
      });
      tools.push(tool);
    }

    console.log('创建种子借用记录...');
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);

    await Borrow.create({
      toolId: tools[0].id,
      userId: resident1.id,
      status: 'borrowed',
      borrowDate: yesterday,
      expectedReturnDate: nextWeek,
      depositAmount: tools[0].deposit,
      depositStatus: 'paid',
      purpose: '家里装修挂照片',
      approvedBy: volunteer.id,
      approvedAt: yesterday
    });

    await Borrow.create({
      toolId: tools[2].id,
      userId: resident2.id,
      status: 'pending',
      borrowDate: tomorrow,
      expectedReturnDate: nextWeek,
      depositAmount: tools[2].deposit,
      depositStatus: 'unpaid',
      purpose: '周末公园野餐'
    });

    await Borrow.create({
      toolId: tools[1].id,
      userId: resident1.id,
      status: 'returned',
      borrowDate: lastWeek,
      expectedReturnDate: yesterday,
      actualReturnDate: yesterday,
      depositAmount: tools[1].deposit,
      depositStatus: 'refunded',
      purpose: '换灯泡',
      approvedBy: volunteer.id,
      approvedAt: lastWeek
    });

    await Borrow.create({
      toolId: tools[3].id,
      userId: resident1.id,
      status: 'pending',
      borrowDate: tomorrow,
      expectedReturnDate: nextWeek,
      depositAmount: tools[3].deposit,
      depositStatus: 'unpaid',
      purpose: '墙面打孔安装置物架'
    });

    console.log('创建种子维修记录...');
    await Maintenance.create({
      toolId: tools[0].id,
      reporterId: resident1.id,
      status: 'completed',
      description: '钻头有点钝了，需要更换',
      photos: [],
      repairCost: 20,
      repairNote: '已更换新钻头',
      repairedBy: volunteer.id,
      repairedAt: yesterday
    });

    console.log('创建种子通知...');
    await Notification.create({
      userId: resident1.id,
      type: 'system',
      title: '欢迎使用社区工具借还系统',
      content: '请完善个人信息并完成实名认证后使用',
      read: false
    });

    console.log('种子数据创建完成！');
    console.log('');
    console.log('测试账号:');
    console.log('  管理员: admin / admin123');
    console.log('  志愿者: volunteer / volunteer123');
    console.log('  居民1:  resident1 / resident123');
    console.log('  居民2:  resident2 / resident123');
    console.log('');

    process.exit(0);
  } catch (error) {
    console.error('种子数据创建失败:', error);
    process.exit(1);
  }
};

seedDatabase();
