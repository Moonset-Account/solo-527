import 'dotenv/config';
import mongoose from 'mongoose';
import User from './models/User.js';
import WorkOrder from './models/WorkOrder.js';
import Batch from './models/Batch.js';
import Material from './models/Material.js';
import Inspection from './models/Inspection.js';
import Schedule from './models/Schedule.js';
import AuditLog from './models/AuditLog.js';

const seed = async () => {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/work_order_trace');
  console.log('连接 MongoDB 成功');

  await Promise.all([
    User.deleteMany(),
    WorkOrder.deleteMany(),
    Batch.deleteMany(),
    Material.deleteMany(),
    Inspection.deleteMany(),
    Schedule.deleteMany(),
    AuditLog.deleteMany()
  ]);

  const users = await User.create([
    { username: 'admin', password: 'admin123', name: '系统管理员', role: 'admin', department: '信息部' },
    { username: 'planner1', password: 'planner123', name: '张小勤', role: 'planner', department: '计划部' },
    { username: 'planner2', password: 'planner123', name: '李思远', role: 'planner', department: '计划部' },
    { username: 'foreman1', password: 'foreman123', name: '王班长', role: 'planner', department: '一车间' }
  ]);
  console.log('已创建用户:', users.map(u => `${u.username}/${u.role}`).join(', '));

  const today = new Date();
  const plus = (d) => new Date(today.getTime() + d * 86400000);
  const minus = (d) => new Date(today.getTime() - d * 86400000);

  const orders = await WorkOrder.create([
    {
      orderNo: 'WO-1001', productName: '精密轴组件 A-12', productCode: 'A-12-2024',
      quantity: 500, priority: 'urgent', status: 'in_production',
      orderDate: minus(5), plannedStartDate: minus(3), plannedEndDate: plus(1),
      actualStartDate: minus(3), customer: '中航精密',
      ownerId: users[1]._id, remark: '加急订单，注意尺寸公差',
      producedQty: 320, workHours: 48, equipmentId: 'CNC-03', equipmentDown: false,
      materialStatus: 'partial', qualityPassRate: 92.5,
      riskFlags: ['临近交期(3天内)', '物料部分齐套']
    },
    {
      orderNo: 'WO-1002', productName: '连接法兰盘 FL-08', productCode: 'FL-08-05',
      quantity: 200, priority: 'high', status: 'pending',
      orderDate: minus(2), plannedStartDate: plus(0), plannedEndDate: plus(4),
      customer: '东方重工', ownerId: users[2]._id,
      producedQty: 0, workHours: 0, equipmentId: 'CNC-02', equipmentDown: false,
      materialStatus: 'not_ready', qualityPassRate: 0,
      riskFlags: ['物料未齐套']
    },
    {
      orderNo: 'WO-1003', productName: '端盖组件 EG-22', productCode: 'EG-22-10',
      quantity: 1200, priority: 'normal', status: 'quality_check',
      orderDate: minus(8), plannedStartDate: minus(6), plannedEndDate: minus(1),
      actualStartDate: minus(6), actualEndDate: minus(1), customer: '南方机电',
      ownerId: users[1]._id,
      producedQty: 1200, workHours: 120, equipmentId: 'CNC-01', equipmentDown: false,
      materialStatus: 'ready', qualityPassRate: 88.5,
      riskFlags: ['合格率偏低(<90%)']
    },
    {
      orderNo: 'WO-1004', productName: '液压阀体 HV-31', productCode: 'HV-31-A',
      quantity: 80, priority: 'low', status: 'draft',
      orderDate: minus(1), plannedStartDate: plus(3), plannedEndDate: plus(10),
      customer: '北控液压', ownerId: users[3]._id,
      producedQty: 0, workHours: 0, equipmentId: '', equipmentDown: false,
      materialStatus: 'not_ready', qualityPassRate: 0, riskFlags: []
    },
    {
      orderNo: 'WO-1005', productName: '齿轮箱支架 GB-05', productCode: 'GB-05-R2',
      quantity: 150, priority: 'high', status: 'in_production',
      orderDate: minus(4), plannedStartDate: minus(2), plannedEndDate: plus(2),
      actualStartDate: minus(2), customer: '西南传动',
      ownerId: users[2]._id, remark: '物料已齐套，设备曾有短时停机',
      producedQty: 90, workHours: 28, equipmentId: 'CNC-04', equipmentDown: true,
      materialStatus: 'ready', qualityPassRate: 95,
      riskFlags: ['临近交期(3天内)', '设备停机']
    },
    {
      orderNo: 'WO-1006', productName: '密封环 SL-17', productCode: 'SL-17-M',
      quantity: 3000, priority: 'normal', status: 'completed',
      orderDate: minus(15), plannedStartDate: minus(12), plannedEndDate: minus(6),
      actualStartDate: minus(12), actualEndDate: minus(5), customer: '海纳密封',
      ownerId: users[1]._id,
      producedQty: 3000, workHours: 72, equipmentId: 'CNC-01', equipmentDown: false,
      materialStatus: 'ready', qualityPassRate: 98.2, riskFlags: []
    }
  ]);
  console.log('已创建工单:', orders.length);

  const batches = [];
  for (const o of orders.slice(0, 3)) {
    batches.push(await Batch.create({
      batchNo: `${o.orderNo}-B01`,
      workOrderId: o._id, productName: o.productName, quantity: Math.floor(o.quantity / 2),
      productionLine: o.equipmentId || 'CNC-01',
      responsibleId: users[1]._id, assistantIds: [users[3]._id],
      rawMaterialLots: [
        { materialCode: 'MAT-45#-001', lotNo: 'L20240510-07', quantity: Math.floor(o.quantity / 2) * 1.05, supplier: '宝钢集团' },
        { materialCode: 'MAT-QT-009', lotNo: 'QT240512-3', quantity: 1, supplier: '壳牌' }
      ],
      produceDate: minus(3), status: o.status === 'completed' ? 'completed' : 'producing',
      traceRemark: '已完成首件确认'
    }));
  }
  console.log('已创建追溯批次:', batches.length);

  for (const o of orders) {
    await Material.create({
      workOrderId: o._id,
      items: [
        { code: 'MAT-45#-001', name: '45号钢棒料', requiredQty: o.quantity * 1.05, preparedQty: o.materialStatus === 'not_ready' ? 0 : Math.floor(o.quantity * 0.7), unit: 'KG', location: 'A-03-12', status: (o.materialStatus === 'ready' ? 'ready' : (o.materialStatus === 'partial' ? 'partial' : 'missing')), remark: '按定额发放' },
        { code: 'MAT-QT-009', name: '淬火液', requiredQty: 1, preparedQty: o.materialStatus === 'not_ready' ? 0 : 1, unit: '桶', location: '化学品仓-02', status: o.materialStatus === 'not_ready' ? 'missing' : 'ready', remark: '' }
      ],
      overallStatus: o.materialStatus,
      preparedBy: users[3]._id,
      remark: ''
    });
  }
  console.log('已创建物料齐套记录');

  for (const o of orders.filter(o => o.producedQty > 0)) {
    await Inspection.create({
      workOrderId: o._id,
      batchId: batches[0]?._id,
      inspectorId: users[3]._id,
      inspectDate: minus(1),
      sampleSize: 50, passQty: Math.round(50 * o.qualityPassRate / 100), failQty: Math.round(50 * (100 - o.qualityPassRate) / 100),
      defectItems: o.qualityPassRate < 95 ? [{ category: '尺寸超差', description: '外径偏大0.02mm', quantity: 2, severity: 'minor' }] : [],
      result: o.qualityPassRate >= 95 ? 'pass' : 'rework',
      conclusion: o.qualityPassRate >= 95 ? '抽检合格，转入下工序' : '需要返工，隔离标识'
    });
  }
  console.log('已创建质检记录');

  for (let i = 0; i < orders.length; i++) {
    const o = orders[i];
    if (o.status === 'completed') continue;
    await Schedule.create({
      workOrderId: o._id,
      productionLine: o.equipmentId || `CNC-0${(i % 4) + 1}`,
      plannedDate: o.plannedStartDate,
      shift: ['morning', 'afternoon', 'full', 'morning'][i % 4],
      operatorId: users[3]._id,
      plannedHours: 8,
      notes: '按标准工艺卡执行',
      equipment: o.equipmentId || `CNC-0${(i % 4) + 1}`
    });
  }
  console.log('已创建排期记录');

  console.log('\n✅ 种子数据初始化完成！');
  console.log('登录账号:');
  console.log('  管理员  admin / admin123');
  console.log('  计划员  planner1 / planner123');
  process.exit(0);
};

seed().catch(err => { console.error(err); process.exit(1); });
