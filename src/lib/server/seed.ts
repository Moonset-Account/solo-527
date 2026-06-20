import { db } from './db';
import { users, reagents, todoItems, riskAlerts, experiments, requisitions } from './schema';
import 'dotenv/config';

const seedData = async () => {
  console.log('Seeding database...');

  const existingUsers = await db.select().from(users);
  if (existingUsers.length === 0) {
    await db.insert(users).values([
      { id: 'user-001', name: '张明', email: 'zhangming@lab.edu', role: 'researcher' },
      { id: 'user-002', name: '李华', email: 'lihua@lab.edu', role: 'researcher' },
      { id: 'user-003', name: '王芳', email: 'wangfang@lab.edu', role: 'researcher' },
      { id: 'user-admin', name: '陈管理员', email: 'admin@lab.edu', role: 'admin' }
    ]);
    console.log('Users seeded');
  }

  const existingReagents = await db.select().from(reagents);
  if (existingReagents.length === 0) {
    await db.insert(reagents).values([
      { id: 'reagent-001', name: '乙醇', casNumber: '64-17-5', category: 'normal', stock: 500, unit: 'ml', hazardLevel: 'low' },
      { id: 'reagent-002', name: '甲醇', casNumber: '67-56-1', category: 'hazardous', stock: 200, unit: 'ml', hazardLevel: 'high' },
      { id: 'reagent-003', name: '浓硫酸', casNumber: '7664-93-9', category: 'hazardous', stock: 100, unit: 'ml', hazardLevel: 'critical' },
      { id: 'reagent-004', name: '氯化钠', casNumber: '7647-14-5', category: 'normal', stock: 1000, unit: 'g', hazardLevel: 'low' },
      { id: 'reagent-005', name: '硝酸银', casNumber: '7761-88-8', category: 'controlled', stock: 50, unit: 'g', hazardLevel: 'high' },
      { id: 'reagent-006', name: '丙酮', casNumber: '67-64-1', category: 'hazardous', stock: 300, unit: 'ml', hazardLevel: 'medium' },
      { id: 'reagent-007', name: '蒸馏水', casNumber: '7732-18-5', category: 'normal', stock: 2000, unit: 'ml', hazardLevel: 'low' },
      { id: 'reagent-008', name: '盐酸', casNumber: '7647-01-0', category: 'hazardous', stock: 150, unit: 'ml', hazardLevel: 'high' }
    ]);
    console.log('Reagents seeded');
  }

  const existingTodos = await db.select().from(todoItems);
  if (existingTodos.length === 0) {
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    const next3Days = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000);
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

    await db.insert(todoItems).values([
      {
        id: 'todo-001',
        type: 'project_report',
        title: '提交2024年Q2课题进展报告',
        description: '整理本季度实验数据，撰写课题进展报告，提交至科研管理系统',
        assignee: '张明',
        assigneeId: 'user-001',
        status: 'pending',
        priority: 'high',
        dueDate: nextWeek
      },
      {
        id: 'todo-002',
        type: 'instrument_booking',
        title: '预约高效液相色谱仪',
        description: '需要使用HPLC分析样品纯度，预约下周二上午9:00-12:00时段',
        assignee: '李华',
        assigneeId: 'user-002',
        status: 'pending',
        priority: 'medium',
        dueDate: next3Days
      },
      {
        id: 'todo-003',
        type: 'sample_tracking',
        title: '更新样本存储位置记录',
        description: '核对-80度冰箱中样本编号和位置，更新样本管理系统',
        assignee: '王芳',
        assigneeId: 'user-003',
        status: 'processing',
        priority: 'medium',
        dueDate: tomorrow
      },
      {
        id: 'todo-004',
        type: 'project_report',
        title: '实验原始数据整理归档',
        description: '将本月所有实验原始数据按照规范整理并归档',
        assignee: '张明',
        assigneeId: 'user-001',
        status: 'pending',
        priority: 'critical',
        dueDate: tomorrow
      },
      {
        id: 'todo-005',
        type: 'instrument_booking',
        title: '预约扫描电子显微镜',
        description: '需要SEM观察材料表面形貌，预约下周三全天',
        assignee: '李华',
        assigneeId: 'user-002',
        status: 'completed',
        priority: 'low',
        dueDate: nextWeek
      },
      {
        id: 'todo-006',
        type: 'sample_tracking',
        title: '废弃化学品处理申请',
        description: '统计本季度废弃化学品，提交处理申请',
        assignee: '王芳',
        assigneeId: 'user-003',
        status: 'pending',
        priority: 'high',
        dueDate: next3Days
      }
    ]);
    console.log('Todo items seeded');
  }

  const existingRisks = await db.select().from(riskAlerts);
  if (existingRisks.length === 0) {
    await db.insert(riskAlerts).values([
      {
        id: 'risk-001',
        reagentId: 'reagent-003',
        reagentName: '浓硫酸',
        userId: 'user-001',
        userName: '张明',
        riskType: '超量领用',
        riskLevel: 'critical',
        description: '单次领用浓硫酸50ml，超过单次最大领用限额25ml',
        status: 'pending'
      },
      {
        id: 'risk-002',
        reagentId: 'reagent-005',
        reagentName: '硝酸银',
        userId: 'user-002',
        userName: '李华',
        riskType: '存储异常',
        riskLevel: 'high',
        description: '硝酸银未按规定避光储存，存在分解风险',
        status: 'processing'
      },
      {
        id: 'risk-003',
        reagentId: 'reagent-002',
        reagentName: '甲醇',
        userId: 'user-003',
        userName: '王芳',
        riskType: '操作不规范',
        riskLevel: 'medium',
        description: '甲醇操作时未在通风橱内进行',
        status: 'pending'
      },
      {
        id: 'risk-004',
        reagentId: 'reagent-008',
        reagentName: '盐酸',
        userId: 'user-001',
        userName: '张明',
        riskType: '过期提醒',
        riskLevel: 'low',
        description: '盐酸试剂即将在30天后过期，请及时处理',
        status: 'resolved',
        resolution: '已确认库存，制定了使用计划，将在过期前用完',
        resolvedAt: new Date()
      }
    ]);
    console.log('Risk alerts seeded');
  }

  const existingExperiments = await db.select().from(experiments);
  if (existingExperiments.length === 0) {
    await db.insert(experiments).values([
      {
        id: 'exp-001',
        userId: 'user-001',
        title: '催化剂合成实验 #042',
        data: '实验目的：合成新型负载型金属催化剂\n实验步骤：1. 载体预处理 2. 金属浸渍 3. 高温焙烧 4. 还原活化\n实验结果：获得催化剂样品5g，表征数据待分析\n原始数据文件：exp_042_raw.xlsx',
        archivedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
      },
      {
        id: 'exp-002',
        userId: 'user-002',
        title: '材料性能测试系列实验',
        data: '实验目的：评估材料的电化学性能\n测试项目：CV曲线、EIS阻抗、恒电流充放电\n测试设备：CHI760E电化学工作站\n测试温度：25°C\n电解液：6M KOH',
        archivedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
      }
    ]);
    console.log('Experiments seeded');
  }

  const existingRequisitions = await db.select().from(requisitions);
  if (existingRequisitions.length === 0) {
    await db.insert(requisitions).values([
      {
        id: 'req-001',
        reagentId: 'reagent-001',
        userId: 'user-001',
        userName: '张明',
        quantity: 100,
        purpose: '清洗玻璃仪器',
        status: 'approved',
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
      },
      {
        id: 'req-002',
        reagentId: 'reagent-004',
        userId: 'user-002',
        userName: '李华',
        quantity: 50,
        purpose: '配置标准溶液',
        status: 'completed',
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      },
      {
        id: 'req-003',
        reagentId: 'reagent-006',
        userId: 'user-003',
        userName: '王芳',
        quantity: 50,
        purpose: '样品提取',
        status: 'pending',
        createdAt: new Date()
      }
    ]);
    console.log('Requisitions seeded');
  }

  console.log('Database seeding completed!');
};

seedData().catch(console.error);
