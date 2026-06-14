import { db } from './index';
import * as schema from './schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

async function seed() {
  console.log('开始初始化种子数据...');

  const hashedPassword = await bcrypt.hash('123456', 10);

  const existingUsers = await db.select().from(schema.users);
  if (existingUsers.length === 0) {
    const users = await db
      .insert(schema.users)
      .values([
        {
          username: 'admin',
          passwordHash: hashedPassword,
          realName: '系统管理员',
          role: 'admin',
          department: '信息中心',
          phone: '13800000001',
          email: 'admin@qinghe.com',
        },
        {
          username: 'planner',
          passwordHash: hashedPassword,
          realName: '李计划员',
          role: 'planner',
          department: '生产计划部',
          phone: '13800000002',
          email: 'planner@qinghe.com',
        },
        {
          username: 'supervisor',
          passwordHash: hashedPassword,
          realName: '王主管',
          role: 'equipment_supervisor',
          department: '设备管理部',
          phone: '13800000003',
          email: 'supervisor@qinghe.com',
        },
      ])
      .returning();
    console.log('✅ 用户数据已初始化', users.length, '条');
  } else {
    console.log('ℹ️  用户数据已存在，跳过初始化');
  }

  const existingMaterials = await db.select().from(schema.materials);
  if (existingMaterials.length === 0) {
    const materials = await db
      .insert(schema.materials)
      .values([
        { materialCode: 'M001', materialName: '304不锈钢板', specification: '2mm×1220mm×2440mm', unit: '张', currentStock: 50, reservedStock: 30, safetyStock: 10, status: 'in_stock', supplier: '宝钢集团', leadTimeDays: 7 },
        { materialCode: 'M002', materialName: '铝合金型材', specification: '6063-T5 40×40', unit: '米', currentStock: 200, reservedStock: 150, safetyStock: 50, status: 'insufficient', supplier: '忠旺铝材', leadTimeDays: 5 },
        { materialCode: 'M003', materialName: '精密轴承', specification: '6205-2RS', unit: '个', currentStock: 5, reservedStock: 0, safetyStock: 20, status: 'out_of_stock', supplier: 'SKF', leadTimeDays: 14, latestDeliveryDate: new Date(Date.now() + 10 * 86400000) },
        { materialCode: 'M004', materialName: 'M8六角螺栓', specification: 'GB/T 5783 M8×30', unit: '个', currentStock: 5000, reservedStock: 1000, safetyStock: 2000, status: 'in_stock', supplier: '晋亿实业', leadTimeDays: 3 },
        { materialCode: 'M005', materialName: '替代不锈钢板', specification: '316L不锈钢板 2mm', unit: '张', currentStock: 20, reservedStock: 0, safetyStock: 5, status: 'in_stock', supplier: '太钢集团', leadTimeDays: 10 },
        { materialCode: 'M006', materialName: '控制模块PCB', specification: 'QC-CONTROL-V2.1', unit: '块', currentStock: 0, reservedStock: 0, safetyStock: 15, status: 'pending_arrival', supplier: '深南电路', leadTimeDays: 21, latestDeliveryDate: new Date(Date.now() + 3 * 86400000) },
      ])
      .returning();
    console.log('✅ 物料数据已初始化', materials.length, '条');

    await db.insert(schema.alternativeMaterials).values([
      {
        originalMaterialId: materials[0].id,
        alternativeMaterialId: materials[4].id,
        conversionRatio: '1.0000',
        priority: 1,
        isApproved: true,
      },
    ]);
    console.log('✅ 替代料关系已初始化');
  } else {
    console.log('ℹ️  物料数据已存在，跳过初始化');
  }

  const existingOrders = await db.select().from(schema.workOrders);
  const users = await db.select().from(schema.users);
  const materials = await db.select().from(schema.materials);
  const adminUser = users.find(u => u.username === 'admin') || users[0];
  const plannerUser = users.find(u => u.username === 'planner') || users[0];
  const supervisorUser = users.find(u => u.username === 'supervisor') || users[0];

  if (existingOrders.length === 0) {
    const orders = await db
      .insert(schema.workOrders)
      .values([
        {
          orderNo: 'WO-2026-06001',
          productName: '自动化输送线模组',
          productCode: 'PRD-AUTO-001',
          quantity: 5,
          unit: '套',
          status: 'in_progress',
          priority: 1,
          plannedStartDate: new Date(Date.now() - 2 * 86400000),
          plannedEndDate: new Date(Date.now() + 5 * 86400000),
          actualStartDate: new Date(Date.now() - 2 * 86400000),
          deliveryDate: new Date(Date.now() + 7 * 86400000),
          deliveryRisk: 'medium',
          customer: '宁德时代新能源科技',
          remark: '关键客户订单，优先安排',
          createdBy: plannerUser.id,
        },
        {
          orderNo: 'WO-2026-06002',
          productName: '精密检测夹具',
          productCode: 'PRD-FIX-015',
          quantity: 20,
          unit: '件',
          status: 'material_ready',
          priority: 2,
          plannedStartDate: new Date(Date.now() + 1 * 86400000),
          plannedEndDate: new Date(Date.now() + 8 * 86400000),
          deliveryDate: new Date(Date.now() + 10 * 86400000),
          deliveryRisk: 'low',
          customer: '比亚迪股份',
          createdBy: plannerUser.id,
        },
        {
          orderNo: 'WO-2026-06003',
          productName: '机器人工作站防护围栏',
          productCode: 'PRD-ENC-008',
          quantity: 2,
          unit: '套',
          status: 'pending',
          priority: 3,
          plannedStartDate: new Date(Date.now() + 3 * 86400000),
          plannedEndDate: new Date(Date.now() + 14 * 86400000),
          deliveryDate: new Date(Date.now() + 15 * 86400000),
          deliveryRisk: 'high',
          customer: '特斯拉上海超级工厂',
          remark: '缺M003轴承，已下单',
          createdBy: plannerUser.id,
        },
        {
          orderNo: 'WO-2026-06004',
          productName: '智能仓储货架系统',
          productCode: 'PRD-RACK-022',
          quantity: 10,
          unit: '组',
          status: 'pending',
          priority: 4,
          plannedStartDate: new Date(Date.now() + 5 * 86400000),
          plannedEndDate: new Date(Date.now() + 20 * 86400000),
          deliveryDate: new Date(Date.now() + 22 * 86400000),
          deliveryRisk: 'low',
          customer: '京东物流亚洲一号',
          createdBy: plannerUser.id,
        },
      ])
      .returning();
    console.log('✅ 工单数据已初始化', orders.length, '条');

    for (const order of orders) {
      await db.insert(schema.workOrderMaterials).values([
        { workOrderId: order.id, materialId: materials[0].id, requiredQuantity: 10, allocatedQuantity: 8, isKitted: false, shortageNote: '缺2张，待替代料确认' },
        { workOrderId: order.id, materialId: materials[1].id, requiredQuantity: 50, allocatedQuantity: 50, isKitted: true },
        { workOrderId: order.id, materialId: materials[3].id, requiredQuantity: 200, allocatedQuantity: 200, isKitted: true },
      ]);
      if (order.orderNo === 'WO-2026-06003') {
        await db.insert(schema.workOrderMaterials).values([
          { workOrderId: order.id, materialId: materials[2].id, requiredQuantity: 20, allocatedQuantity: 0, isKitted: false, shortageNote: '缺货严重，交期14天' },
          { workOrderId: order.id, materialId: materials[5].id, requiredQuantity: 4, allocatedQuantity: 0, isKitted: false, shortageNote: 'PCB待到货' },
        ]);
      }
    }
    console.log('✅ 工单物料数据已初始化');

    const processData = [];
    for (const order of orders) {
      const baseProcesses = [
        { workOrderId: order.id, processName: '原材料下料', processCode: 'P001', sequence: 1, plannedDurationHours: '4', equipment: '激光切割机LC-01', assignedTo: supervisorUser.id },
        { workOrderId: order.id, processName: 'CNC精密加工', processCode: 'P002', sequence: 2, plannedDurationHours: '8', equipment: '五轴加工中心MC-03', assignedTo: supervisorUser.id },
        { workOrderId: order.id, processName: '表面处理', processCode: 'P003', sequence: 3, plannedDurationHours: '6', equipment: '阳极氧化线AO-02', assignedTo: supervisorUser.id },
        { workOrderId: order.id, processName: '组装调试', processCode: 'P004', sequence: 4, plannedDurationHours: '12', equipment: '装配工位AS-05', assignedTo: supervisorUser.id },
        { workOrderId: order.id, processName: '质检出货', processCode: 'P005', sequence: 5, plannedDurationHours: '2', equipment: 'QC检测台QC-01', assignedTo: supervisorUser.id },
      ];
      processData.push(...baseProcesses);
    }
    const processes = await db.insert(schema.processes).values(processData).returning();
    console.log('✅ 工序数据已初始化', processes.length, '条');

    const inProgressOrder = orders.find(o => o.orderNo === 'WO-2026-06001');
    if (inProgressOrder) {
      const orderProcesses = processes.filter(p => p.workOrderId === inProgressOrder.id);
      if (orderProcesses[0]) {
        await db.update(schema.processes).set({ status: 'completed', actualStartAt: new Date(Date.now() - 2 * 86400000), actualEndAt: new Date(Date.now() - 1.5 * 86400000), actualDurationHours: '3.5' }).where(eq(schema.processes.id, orderProcesses[0].id));
      }
      if (orderProcesses[1]) {
        await db.update(schema.processes).set({ status: 'rework', actualStartAt: new Date(Date.now() - 1.5 * 86400000), reworkCount: 1, reworkTimeoutAt: new Date(Date.now() + 1 * 86400000) }).where(eq(schema.processes.id, orderProcesses[1].id));
        const rework = await db.insert(schema.reworkRecords).values({
          processId: orderProcesses[1].id,
          workOrderId: inProgressOrder.id,
          reworkReason: '孔位加工精度偏差0.05mm，超出图纸公差要求',
          reworkType: '加工精度',
          reworkCount: 1,
          reportedBy: supervisorUser.id,
          assignedTo: supervisorUser.id,
          deadlineAt: new Date(Date.now() + 1 * 86400000),
        }).returning();

        await db.insert(schema.timelineEvents).values([
          { workOrderId: inProgressOrder.id, eventType: 'work_order_created', title: '工单创建', description: `创建工单 ${inProgressOrder.orderNo}`, triggeredBy: plannerUser.id, triggeredByName: plannerUser.realName, eventAt: inProgressOrder.createdAt },
          { workOrderId: inProgressOrder.id, processId: orderProcesses[0].id, eventType: 'process_started', title: '工序开始：原材料下料', description: `工序 ${orderProcesses[0].processName} 开始加工`, triggeredBy: supervisorUser.id, triggeredByName: supervisorUser.realName, eventAt: new Date(Date.now() - 2 * 86400000) },
          { workOrderId: inProgressOrder.id, processId: orderProcesses[0].id, eventType: 'process_completed', title: '工序完成：原材料下料', description: '下料完成，共10件，合格率100%', triggeredBy: supervisorUser.id, triggeredByName: supervisorUser.realName, eventAt: new Date(Date.now() - 1.5 * 86400000) },
          { workOrderId: inProgressOrder.id, processId: orderProcesses[1].id, eventType: 'process_started', title: '工序开始：CNC精密加工', description: `工序 ${orderProcesses[1].processName} 开始加工`, triggeredBy: supervisorUser.id, triggeredByName: supervisorUser.realName, eventAt: new Date(Date.now() - 1.5 * 86400000) },
          { workOrderId: inProgressOrder.id, processId: orderProcesses[1].id, reworkRecordId: rework[0].id, eventType: 'process_rework', title: '返工记录：CNC加工精度偏差', description: '孔位加工精度偏差0.05mm，需要返工', triggeredBy: supervisorUser.id, triggeredByName: supervisorUser.realName, eventAt: new Date(Date.now() - 0.5 * 86400000), metadata: { reworkReason: '孔位加工精度偏差0.05mm' } },
          { workOrderId: inProgressOrder.id, eventType: 'material_shortage', title: '物料缺料提醒', description: '304不锈钢板缺2张，已申请替代料', triggeredBy: plannerUser.id, triggeredByName: plannerUser.realName, eventAt: new Date(Date.now() - 0.3 * 86400000) },
        ]);
        console.log('✅ 时间线事件已初始化');
      }
    }

    const delayedOrder = orders.find(o => o.orderNo === 'WO-2026-06003');
    if (delayedOrder) {
      await db.insert(schema.timelineEvents).values([
        { workOrderId: delayedOrder.id, eventType: 'work_order_created', title: '工单创建', description: `创建工单 ${delayedOrder.orderNo}`, triggeredBy: plannerUser.id, triggeredByName: plannerUser.realName, eventAt: delayedOrder.createdAt },
        { workOrderId: delayedOrder.id, eventType: 'delivery_warning', title: '交期风险预警：高', description: '精密轴承M003缺货，交期14天，可能影响出货', triggeredBy: plannerUser.id, triggeredByName: plannerUser.realName, eventAt: new Date(Date.now() - 0.1 * 86400000) },
      ]);
    }
  } else {
    console.log('ℹ️  工单数据已存在，跳过初始化');
  }

  console.log('🎉 种子数据初始化完成！');
  console.log('');
  console.log('默认登录账号（密码均为 123456）：');
  console.log('  admin       - 系统管理员');
  console.log('  planner     - 李计划员（计划员）');
  console.log('  supervisor  - 王主管（设备主管）');
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ 种子数据初始化失败：', err);
  process.exit(1);
});
