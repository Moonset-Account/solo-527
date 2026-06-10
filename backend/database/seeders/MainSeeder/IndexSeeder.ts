import BaseSeeder from '@ioc:Adonis/Lucid/Seeder'
import Role from 'App/Models/Role'
import User from 'App/Models/User'
import Material from 'App/Models/Material'
import WorkOrder from 'App/Models/WorkOrder'
import Schedule from 'App/Models/Schedule'
import Rework from 'App/Models/Rework'
import ProductionLog from 'App/Models/ProductionLog'
import WorkOrderMaterial from 'App/Models/WorkOrderMaterial'
import RiskLog from 'App/Models/RiskLog'
import { DateTime } from 'luxon'

export default class extends BaseSeeder {
  private async runSeeder(seeder: { default: typeof BaseSeeder }) {
    await new seeder.default(this.client).run()
  }

  public async run() {
    await this.createRoles()
    await this.createUsers()
    await this.createMaterials()
    await this.createWorkOrders()
    await this.createSchedules()
    await this.createWorkOrderMaterials()
    await this.createReworks()
    await this.createProductionLogs()
    await this.createRiskLogs()
  }

  private async createRoles() {
    const roles = [
      { name: '管理员', slug: 'admin', description: '系统管理员，拥有全部权限' },
      { name: '版房负责人', slug: 'workshop_manager', description: '版房负责人，管理工单和排产' },
      { name: '计划员', slug: 'planner', description: '计划员，查看数据和报表' },
    ]

    for (const role of roles) {
      await Role.firstOrCreate({ slug: role.slug }, role)
    }
  }

  private async createUsers() {
    const users = [
      {
        username: 'admin',
        email: 'admin@example.com',
        password: 'admin123',
        realName: '系统管理员',
        phone: '13800138000',
        department: '信息部',
        roles: ['admin'] as string[],
      },
      {
        username: 'manager',
        email: 'manager@example.com',
        password: 'manager123',
        realName: '张主管',
        phone: '13800138001',
        department: '版房部',
        roles: ['workshop_manager', 'planner'] as string[],
      },
      {
        username: 'planner',
        email: 'planner@example.com',
        password: 'planner123',
        realName: '李计划',
        phone: '13800138002',
        department: '计划部',
        roles: ['planner'] as string[],
      },
    ]

    for (const userData of users) {
      const user = await User.firstOrCreate(
        { email: userData.email },
        {
          username: userData.username,
          email: userData.email,
          password: userData.password,
          realName: userData.realName,
          phone: userData.phone,
          department: userData.department,
          isActive: true,
        }
      )

      const roles = await Role.query().whereIn('slug', userData.roles)
      await user.related('roles').sync(roles.map((r) => r.id))
    }
  }

  private async createMaterials() {
    const materials = [
      { materialCode: 'M001', materialName: '面料A', specification: '100%棉', unit: '米', stockQuantity: 5000, safetyStock: 500, supplier: '供应商A', unitPrice: 25.5 },
      { materialCode: 'M002', materialName: '面料B', specification: '涤纶混纺', unit: '米', stockQuantity: 3200, safetyStock: 300, supplier: '供应商B', unitPrice: 18.0 },
      { materialCode: 'M003', materialName: '纽扣', specification: '15mm树脂扣', unit: '个', stockQuantity: 50000, safetyStock: 5000, supplier: '辅料商C', unitPrice: 0.5 },
      { materialCode: 'M004', materialName: '拉链', specification: '20cm尼龙拉链', unit: '条', stockQuantity: 8000, safetyStock: 800, supplier: '拉链厂D', unitPrice: 3.2 },
      { materialCode: 'M005', materialName: '线', specification: '402涤纶线', unit: '卷', stockQuantity: 2000, safetyStock: 200, supplier: '线厂E', unitPrice: 5.0 },
      { materialCode: 'M006', materialName: '衬布', specification: '有纺衬', unit: '米', stockQuantity: 1500, safetyStock: 200, supplier: '衬布厂F', unitPrice: 12.0 },
      { materialCode: 'M007', materialName: '皮革', specification: '头层牛皮', unit: '平方尺', stockQuantity: 800, safetyStock: 100, supplier: '皮革商G', unitPrice: 45.0 },
      { materialCode: 'M008', materialName: '五金件', specification: '合金扣', unit: '个', stockQuantity: 12000, safetyStock: 1000, supplier: '五金厂H', unitPrice: 2.8 },
    ]

    for (const mat of materials) {
      await Material.firstOrCreate({ materialCode: mat.materialCode }, mat)
    }
  }

  private async createWorkOrders() {
    const admin = await User.findBy('email', 'admin@example.com')
    const manager = await User.findBy('email', 'manager@example.com')

    const orders = [
      {
        orderNo: 'WO2024001',
        productName: '男士衬衫',
        productModel: 'MS-001',
        quantity: 500,
        completedQuantity: 320,
        customerName: '客户A',
        status: 'in_production' as const,
        priority: 'high' as const,
        plannedStartDate: DateTime.now().minus({ days: 5 }),
        plannedEndDate: DateTime.now().plus({ days: 3 }),
        deliveryDate: DateTime.now().plus({ days: 5 }),
        assignedTo: manager?.id ?? null,
      },
      {
        orderNo: 'WO2024002',
        productName: '女士连衣裙',
        productModel: 'LD-002',
        quantity: 300,
        completedQuantity: 0,
        customerName: '客户B',
        status: 'scheduled' as const,
        priority: 'medium' as const,
        plannedStartDate: DateTime.now().plus({ days: 1 }),
        plannedEndDate: DateTime.now().plus({ days: 7 }),
        deliveryDate: DateTime.now().plus({ days: 10 }),
        assignedTo: manager?.id ?? null,
      },
      {
        orderNo: 'WO2024003',
        productName: '儿童外套',
        productModel: 'KC-003',
        quantity: 800,
        completedQuantity: 800,
        customerName: '客户C',
        status: 'completed' as const,
        priority: 'low' as const,
        plannedStartDate: DateTime.now().minus({ days: 15 }),
        plannedEndDate: DateTime.now().minus({ days: 5 }),
        actualStartDate: DateTime.now().minus({ days: 14 }),
        actualEndDate: DateTime.now().minus({ days: 6 }),
        deliveryDate: DateTime.now().minus({ days: 3 }),
        assignedTo: manager?.id ?? null,
      },
      {
        orderNo: 'WO2024004',
        productName: '男士西裤',
        productModel: 'MP-004',
        quantity: 200,
        completedQuantity: 50,
        customerName: '客户D',
        status: 'delayed' as const,
        priority: 'urgent' as const,
        plannedStartDate: DateTime.now().minus({ days: 10 }),
        plannedEndDate: DateTime.now().minus({ days: 2 }),
        actualStartDate: DateTime.now().minus({ days: 8 }),
        deliveryDate: DateTime.now().minus({ days: 1 }),
        assignedTo: manager?.id ?? null,
      },
      {
        orderNo: 'WO2024005',
        productName: '女装上衣',
        productModel: 'LT-005',
        quantity: 400,
        completedQuantity: 0,
        customerName: '客户E',
        status: 'pending' as const,
        priority: 'medium' as const,
        deliveryDate: DateTime.now().plus({ days: 15 }),
        assignedTo: null,
      },
      {
        orderNo: 'WO2024006',
        productName: '牛仔裤',
        productModel: 'JN-006',
        quantity: 600,
        completedQuantity: 0,
        customerName: '客户F',
        status: 'pending' as const,
        priority: 'high' as const,
        deliveryDate: DateTime.now().plus({ days: 8 }),
        assignedTo: null,
      },
      {
        orderNo: 'WO2024007',
        productName: '运动套装',
        productModel: 'ST-007',
        quantity: 350,
        completedQuantity: 100,
        customerName: '客户G',
        status: 'in_production' as const,
        priority: 'medium' as const,
        plannedStartDate: DateTime.now().minus({ days: 3 }),
        plannedEndDate: DateTime.now().plus({ days: 5 }),
        deliveryDate: DateTime.now().plus({ days: 8 }),
        assignedTo: manager?.id ?? null,
      },
      {
        orderNo: 'WO2024008',
        productName: '羽绒服',
        productModel: 'DW-008',
        quantity: 150,
        completedQuantity: 0,
        customerName: '客户H',
        status: 'scheduled' as const,
        priority: 'high' as const,
        plannedStartDate: DateTime.now().plus({ days: 2 }),
        plannedEndDate: DateTime.now().plus({ days: 12 }),
        deliveryDate: DateTime.now().plus({ days: 15 }),
        assignedTo: manager?.id ?? null,
      },
    ]

    for (const order of orders) {
      await WorkOrder.firstOrCreate(
        { orderNo: order.orderNo },
        {
          ...order,
          createdBy: admin?.id ?? 1,
        }
      )
    }
  }

  private async createSchedules() {
    const manager = await User.findBy('email', 'manager@example.com')
    const order1 = await WorkOrder.findBy('orderNo', 'WO2024001')
    const order2 = await WorkOrder.findBy('orderNo', 'WO2024002')
    const order7 = await WorkOrder.findBy('orderNo', 'WO2024007')
    const order8 = await WorkOrder.findBy('orderNo', 'WO2024008')

    const schedules = [
      { workOrderId: order1?.id ?? 0, scheduleDate: DateTime.now().plus({ days: 0 }), workshop: '一车间', line: 'A线', plannedQuantity: 100, shift: 'morning' as const },
      { workOrderId: order1?.id ?? 0, scheduleDate: DateTime.now().plus({ days: 1 }), workshop: '一车间', line: 'A线', plannedQuantity: 100, shift: 'morning' as const },
      { workOrderId: order1?.id ?? 0, scheduleDate: DateTime.now().plus({ days: 2 }), workshop: '一车间', line: 'B线', plannedQuantity: 80, shift: 'afternoon' as const },
      { workOrderId: order2?.id ?? 0, scheduleDate: DateTime.now().plus({ days: 1 }), workshop: '二车间', line: 'C线', plannedQuantity: 80, shift: 'morning' as const },
      { workOrderId: order2?.id ?? 0, scheduleDate: DateTime.now().plus({ days: 2 }), workshop: '二车间', line: 'C线', plannedQuantity: 80, shift: 'morning' as const },
      { workOrderId: order7?.id ?? 0, scheduleDate: DateTime.now().plus({ days: 0 }), workshop: '三车间', line: 'D线', plannedQuantity: 60, shift: 'morning' as const },
      { workOrderId: order7?.id ?? 0, scheduleDate: DateTime.now().plus({ days: 1 }), workshop: '三车间', line: 'D线', plannedQuantity: 60, shift: 'afternoon' as const },
      { workOrderId: order8?.id ?? 0, scheduleDate: DateTime.now().plus({ days: 3 }), workshop: '四车间', line: 'E线', plannedQuantity: 30, shift: 'morning' as const },
      { workOrderId: order8?.id ?? 0, scheduleDate: DateTime.now().plus({ days: 4 }), workshop: '四车间', line: 'E线', plannedQuantity: 30, shift: 'morning' as const },
    ]

    for (const s of schedules) {
      if (s.workOrderId > 0) {
        await Schedule.create({
          ...s,
          scheduledBy: manager?.id ?? null,
        })
      }
    }
  }

  private async createWorkOrderMaterials() {
    const order1 = await WorkOrder.findBy('orderNo', 'WO2024001')
    const order2 = await WorkOrder.findBy('orderNo', 'WO2024002')
    const order4 = await WorkOrder.findBy('orderNo', 'WO2024004')
    const order7 = await WorkOrder.findBy('orderNo', 'WO2024007')

    const materials = [
      { workOrderId: order1?.id, materialCode: 'M001', requiredQuantity: 1000, allocatedQuantity: 800, isReady: true },
      { workOrderId: order1?.id, materialCode: 'M003', requiredQuantity: 1000, allocatedQuantity: 1000, isReady: true },
      { workOrderId: order1?.id, materialCode: 'M005', requiredQuantity: 50, allocatedQuantity: 50, isReady: true },
      { workOrderId: order1?.id, materialCode: 'M006', requiredQuantity: 400, allocatedQuantity: 200, isReady: false },
      { workOrderId: order2?.id, materialCode: 'M002', requiredQuantity: 600, allocatedQuantity: 600, isReady: true },
      { workOrderId: order2?.id, materialCode: 'M004', requiredQuantity: 300, allocatedQuantity: 300, isReady: true },
      { workOrderId: order2?.id, materialCode: 'M005', requiredQuantity: 30, allocatedQuantity: 30, isReady: true },
      { workOrderId: order4?.id, materialCode: 'M001', requiredQuantity: 400, allocatedQuantity: 350, isReady: true },
      { workOrderId: order4?.id, materialCode: 'M008', requiredQuantity: 600, allocatedQuantity: 500, isReady: false },
      { workOrderId: order7?.id, materialCode: 'M002', requiredQuantity: 700, allocatedQuantity: 700, isReady: true },
      { workOrderId: order7?.id, materialCode: 'M003', requiredQuantity: 700, allocatedQuantity: 700, isReady: true },
    ]

    for (const item of materials) {
      const material = await Material.findBy('materialCode', item.materialCode)
      if (material && item.workOrderId) {
        await WorkOrderMaterial.firstOrCreate(
          { workOrderId: item.workOrderId, materialId: material.id },
          {
            workOrderId: item.workOrderId,
            materialId: material.id,
            requiredQuantity: item.requiredQuantity,
            allocatedQuantity: item.allocatedQuantity,
            isReady: item.isReady,
          }
        )
      }
    }
  }

  private async createReworks() {
    const order1 = await WorkOrder.findBy('orderNo', 'WO2024001')
    const order4 = await WorkOrder.findBy('orderNo', 'WO2024004')
    const manager = await User.findBy('email', 'manager@example.com')

    const reworks = [
      {
        workOrderId: order1?.id ?? 0,
        quantity: 15,
        reason: 'quality_issue' as const,
        description: '缝线不整齐，需要返工',
        reworkProcess: '重新缝制',
        handledBy: manager?.id ?? null,
        status: 'completed' as const,
      },
      {
        workOrderId: order1?.id ?? 0,
        quantity: 8,
        reason: 'material_defect' as const,
        description: '面料有瑕疵',
        reworkProcess: '换料重制',
        handledBy: manager?.id ?? null,
        status: 'reworking' as const,
      },
      {
        workOrderId: order4?.id ?? 0,
        quantity: 25,
        reason: 'process_error' as const,
        description: '工艺错误导致尺寸偏差',
        reworkProcess: '修正工艺',
        handledBy: manager?.id ?? null,
        status: 'pending' as const,
      },
      {
        workOrderId: order4?.id ?? 0,
        quantity: 10,
        reason: 'customer_request' as const,
        description: '客户要求修改细节',
        reworkProcess: '按客户要求修改',
        handledBy: manager?.id ?? null,
        status: 'reworking' as const,
      },
    ]

    for (const rework of reworks) {
      if (rework.workOrderId > 0) {
        await Rework.create(rework)
      }
    }
  }

  private async createProductionLogs() {
    const order1 = await WorkOrder.findBy('orderNo', 'WO2024001')
    const order3 = await WorkOrder.findBy('orderNo', 'WO2024003')
    const order7 = await WorkOrder.findBy('orderNo', 'WO2024007')
    const manager = await User.findBy('email', 'manager@example.com')

    const logs = [
      { workOrderId: order1?.id ?? 0, productionDate: DateTime.now().minus({ days: 4 }), outputQuantity: 80, defectQuantity: 3, workHours: 8, manHours: 160, operatorCount: 20, shift: 'morning', workshop: '一车间' },
      { workOrderId: order1?.id ?? 0, productionDate: DateTime.now().minus({ days: 3 }), outputQuantity: 90, defectQuantity: 2, workHours: 8, manHours: 180, operatorCount: 22, shift: 'morning', workshop: '一车间' },
      { workOrderId: order1?.id ?? 0, productionDate: DateTime.now().minus({ days: 2 }), outputQuantity: 85, defectQuantity: 4, workHours: 8, manHours: 170, operatorCount: 21, shift: 'morning', workshop: '一车间' },
      { workOrderId: order1?.id ?? 0, productionDate: DateTime.now().minus({ days: 1 }), outputQuantity: 65, defectQuantity: 5, workHours: 6, manHours: 130, operatorCount: 20, shift: 'afternoon', workshop: '一车间' },
      { workOrderId: order3?.id ?? 0, productionDate: DateTime.now().minus({ days: 14 }), outputQuantity: 100, defectQuantity: 2, workHours: 8, manHours: 200, operatorCount: 25, shift: 'morning', workshop: '二车间' },
      { workOrderId: order3?.id ?? 0, productionDate: DateTime.now().minus({ days: 13 }), outputQuantity: 120, defectQuantity: 3, workHours: 8, manHours: 220, operatorCount: 26, shift: 'morning', workshop: '二车间' },
      { workOrderId: order3?.id ?? 0, productionDate: DateTime.now().minus({ days: 12 }), outputQuantity: 130, defectQuantity: 1, workHours: 8, manHours: 240, operatorCount: 28, shift: 'morning', workshop: '二车间' },
      { workOrderId: order3?.id ?? 0, productionDate: DateTime.now().minus({ days: 11 }), outputQuantity: 140, defectQuantity: 4, workHours: 8, manHours: 260, operatorCount: 30, shift: 'morning', workshop: '二车间' },
      { workOrderId: order3?.id ?? 0, productionDate: DateTime.now().minus({ days: 10 }), outputQuantity: 150, defectQuantity: 2, workHours: 8, manHours: 280, operatorCount: 32, shift: 'morning', workshop: '二车间' },
      { workOrderId: order3?.id ?? 0, productionDate: DateTime.now().minus({ days: 9 }), outputQuantity: 160, defectQuantity: 3, workHours: 8, manHours: 300, operatorCount: 35, shift: 'morning', workshop: '二车间' },
      { workOrderId: order7?.id ?? 0, productionDate: DateTime.now().minus({ days: 3 }), outputQuantity: 50, defectQuantity: 2, workHours: 8, manHours: 100, operatorCount: 12, shift: 'morning', workshop: '三车间' },
      { workOrderId: order7?.id ?? 0, productionDate: DateTime.now().minus({ days: 2 }), outputQuantity: 30, defectQuantity: 1, workHours: 5, manHours: 60, operatorCount: 12, shift: 'afternoon', workshop: '三车间' },
    ]

    for (const log of logs) {
      if (log.workOrderId > 0) {
        await ProductionLog.create({
          ...log,
          recordedBy: manager?.id ?? null,
        })
      }
    }
  }

  private async createRiskLogs() {
    const order4 = await WorkOrder.findBy('orderNo', 'WO2024004')
    const order1 = await WorkOrder.findBy('orderNo', 'WO2024001')
    const order6 = await WorkOrder.findBy('orderNo', 'WO2024006')
    const manager = await User.findBy('email', 'manager@example.com')

    const risks = [
      {
        workOrderId: order4?.id ?? 0,
        riskLevel: 'critical' as const,
        riskType: 'delivery_delay',
        description: '工单已延期，交期已过，需紧急处理',
        actionBy: manager?.id ?? null,
        actionAt: DateTime.now().minus({ days: 1 }),
        status: 'open' as const,
      },
      {
        workOrderId: order4?.id ?? 0,
        riskLevel: 'high' as const,
        riskType: 'material_shortage',
        description: '五金件库存不足，可能影响生产进度',
        status: 'open' as const,
      },
      {
        workOrderId: order1?.id ?? 0,
        riskLevel: 'medium' as const,
        riskType: 'rework_issue',
        description: '存在返工情况，需关注质量问题',
        status: 'mitigated' as const,
        actionBy: manager?.id ?? null,
        actionAt: DateTime.now().minus({ days: 2 }),
        actionTaken: '已安排质检加强检验',
      },
      {
        workOrderId: order6?.id ?? 0,
        riskLevel: 'high' as const,
        riskType: 'tight_schedule',
        description: '交期紧张，需尽快安排生产',
        status: 'open' as const,
      },
    ]

    for (const risk of risks) {
      if (risk.workOrderId > 0) {
        await RiskLog.create(risk)
      }
    }
  }
}
