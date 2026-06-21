import { BaseSeeder } from '@adonisjs/lucid/seeders'
import env from '#start/env'
import User from '#models/user'
import Reagent from '#models/reagent'
import ReagentBatch from '#models/reagent_batch'
import Project from '#models/project'
import Requisition from '#models/requisition'
import RequisitionItem from '#models/requisition_item'
import Equipment from '#models/equipment'
import EquipmentAlert from '#models/equipment_alert'
import AuditLog from '#models/audit_log'
import OperationHistory from '#models/operation_history'
import PermissionRequest from '#models/permission_request'
import hash from '@adonisjs/core/services/hash'
import { DateTime } from 'luxon'

export default class extends BaseSeeder {
  public async run() {
    if (env.get('DEMO_MODE') !== 'true') {
      return
    }

    const users = await User.createMany([
      {
        username: 'admin',
        passwordHash: await hash.make('password123'),
        displayName: '张管理',
        role: 'admin',
        status: 'active',
      },
      {
        username: 'reagent_mgr',
        passwordHash: await hash.make('password123'),
        displayName: '李试剂',
        role: 'reagent_manager',
        status: 'active',
      },
      {
        username: 'leader_wang',
        passwordHash: await hash.make('password123'),
        displayName: '王组长',
        role: 'project_leader',
        status: 'active',
      },
      {
        username: 'leader_zhao',
        passwordHash: await hash.make('password123'),
        displayName: '赵组长',
        role: 'project_leader',
        status: 'active',
      },
      {
        username: 'staff_chen',
        passwordHash: await hash.make('password123'),
        displayName: '陈实验员',
        role: 'staff',
        status: 'active',
      },
      {
        username: 'staff_liu',
        passwordHash: await hash.make('password123'),
        displayName: '刘实验员',
        role: 'staff',
        status: 'active',
      },
      {
        username: 'staff_sun',
        passwordHash: await hash.make('password123'),
        displayName: '孙实验员',
        role: 'staff',
        status: 'pending_review',
      },
    ])

    const reagents = await Reagent.createMany([
      {
        name: '盐酸',
        casNumber: '7647-01-0',
        category: '无机酸',
        dangerLevel: 'hazardous',
        storageCondition: '阴凉通风处，远离金属',
        unit: '瓶(500mL)',
        unitPrice: 35.0,
        totalQuantity: 120,
        warningThreshold: 20,
        isControlled: false,
      },
      {
        name: '硫酸',
        casNumber: '7664-93-9',
        category: '无机酸',
        dangerLevel: 'highly_hazardous',
        storageCondition: '专用酸柜，远离有机物',
        unit: '瓶(500mL)',
        unitPrice: 42.0,
        totalQuantity: 80,
        warningThreshold: 15,
        isControlled: false,
      },
      {
        name: '氢氧化钠',
        casNumber: '1310-73-2',
        category: '无机碱',
        dangerLevel: 'hazardous',
        storageCondition: '干燥密封保存',
        unit: '瓶(500g)',
        unitPrice: 28.0,
        totalQuantity: 95,
        warningThreshold: 15,
        isControlled: false,
      },
      {
        name: '无水乙醇',
        casNumber: '64-17-5',
        category: '有机溶剂',
        dangerLevel: 'hazardous',
        storageCondition: '阴凉通风，远离火源',
        unit: '瓶(500mL)',
        unitPrice: 55.0,
        totalQuantity: 200,
        warningThreshold: 30,
        isControlled: false,
      },
      {
        name: '丙酮',
        casNumber: '67-64-1',
        category: '有机溶剂',
        dangerLevel: 'hazardous',
        storageCondition: '阴凉通风，远离火源',
        unit: '瓶(500mL)',
        unitPrice: 48.0,
        totalQuantity: 150,
        warningThreshold: 25,
        isControlled: false,
      },
      {
        name: '甲苯',
        casNumber: '108-88-3',
        category: '有机溶剂',
        dangerLevel: 'hazardous',
        storageCondition: '阴凉通风，远离火源',
        unit: '瓶(500mL)',
        unitPrice: 52.0,
        totalQuantity: 60,
        warningThreshold: 10,
        isControlled: false,
      },
      {
        name: '高锰酸钾',
        casNumber: '7722-64-7',
        category: '氧化剂',
        dangerLevel: 'hazardous',
        storageCondition: '避光密封，远离有机物',
        unit: '瓶(500g)',
        unitPrice: 65.0,
        totalQuantity: 8,
        warningThreshold: 10,
        isControlled: true,
      },
      {
        name: '浓硝酸',
        casNumber: '7697-37-2',
        category: '无机酸',
        dangerLevel: 'highly_hazardous',
        storageCondition: '专用酸柜，避光保存',
        unit: '瓶(500mL)',
        unitPrice: 58.0,
        totalQuantity: 45,
        warningThreshold: 10,
        isControlled: false,
      },
      {
        name: '甲醇',
        casNumber: '67-56-1',
        category: '有机溶剂',
        dangerLevel: 'highly_hazardous',
        storageCondition: '阴凉通风，远离火源',
        unit: '瓶(500mL)',
        unitPrice: 40.0,
        totalQuantity: 5,
        warningThreshold: 20,
        isControlled: false,
      },
      {
        name: '磷酸二氢钾',
        casNumber: '7778-77-0',
        category: '无机盐',
        dangerLevel: 'normal',
        storageCondition: '干燥密封保存',
        unit: '瓶(500g)',
        unitPrice: 32.0,
        totalQuantity: 110,
        warningThreshold: 20,
        isControlled: false,
      },
      {
        name: '乙酸乙酯',
        casNumber: '141-78-6',
        category: '有机溶剂',
        dangerLevel: 'hazardous',
        storageCondition: '阴凉通风，远离火源',
        unit: '瓶(500mL)',
        unitPrice: 45.0,
        totalQuantity: 75,
        warningThreshold: 15,
        isControlled: false,
      },
      {
        name: '氯化钠',
        casNumber: '7647-14-5',
        category: '无机盐',
        dangerLevel: 'normal',
        storageCondition: '干燥密封保存',
        unit: '瓶(500g)',
        unitPrice: 15.0,
        totalQuantity: 250,
        warningThreshold: 30,
        isControlled: false,
      },
    ])

    const batches = await ReagentBatch.createMany([
      {
        reagentId: reagents[0].id,
        batchNumber: 'HCl-2024-001',
        supplier: '国药集团化学试剂有限公司',
        productionDate: DateTime.fromISO('2024-03-15'),
        expiryDate: DateTime.fromISO('2027-03-15'),
        storageLocation: 'A区-酸柜-01',
        quantity: 60,
        unitPrice: 35.0,
      },
      {
        reagentId: reagents[0].id,
        batchNumber: 'HCl-2024-002',
        supplier: '西陇科学股份有限公司',
        productionDate: DateTime.fromISO('2024-06-20'),
        expiryDate: DateTime.fromISO('2027-06-20'),
        storageLocation: 'A区-酸柜-01',
        quantity: 60,
        unitPrice: 36.0,
      },
      {
        reagentId: reagents[1].id,
        batchNumber: 'H2SO4-2024-001',
        supplier: '国药集团化学试剂有限公司',
        productionDate: DateTime.fromISO('2024-01-10'),
        expiryDate: DateTime.fromISO('2029-01-10'),
        storageLocation: 'A区-酸柜-02',
        quantity: 80,
        unitPrice: 42.0,
      },
      {
        reagentId: reagents[3].id,
        batchNumber: 'EtOH-2024-001',
        supplier: '天津市大茂化学试剂厂',
        productionDate: DateTime.fromISO('2024-04-05'),
        expiryDate: DateTime.fromISO('2026-04-05'),
        storageLocation: 'B区-溶剂柜-01',
        quantity: 120,
        unitPrice: 55.0,
      },
      {
        reagentId: reagents[3].id,
        batchNumber: 'EtOH-2024-002',
        supplier: '国药集团化学试剂有限公司',
        productionDate: DateTime.fromISO('2024-08-12'),
        expiryDate: DateTime.fromISO('2026-08-12'),
        storageLocation: 'B区-溶剂柜-01',
        quantity: 80,
        unitPrice: 54.0,
      },
      {
        reagentId: reagents[6].id,
        batchNumber: 'KMnO4-2024-001',
        supplier: '国药集团化学试剂有限公司',
        productionDate: DateTime.fromISO('2024-02-20'),
        expiryDate: DateTime.fromISO('2026-02-20'),
        storageLocation: 'C区-管制柜-01',
        quantity: 8,
        unitPrice: 65.0,
      },
    ])

    const projects = await Project.createMany([
      {
        name: '新型纳米材料合成与表征',
        principalId: users[2].id,
        budget: 500000,
        spent: 125000,
        status: 'active',
      },
      {
        name: '药物中间体合成工艺优化',
        principalId: users[3].id,
        budget: 350000,
        spent: 210000,
        status: 'active',
      },
      {
        name: '环境水质重金属检测方法开发',
        principalId: users[2].id,
        budget: 200000,
        spent: 200000,
        status: 'completed',
      },
      {
        name: '高分子材料阻燃性能研究',
        principalId: users[3].id,
        budget: 280000,
        spent: 50000,
        status: 'suspended',
      },
    ])

    const requisitions = await Requisition.createMany([
      {
        applicantId: users[4].id,
        projectId: projects[0].id,
        status: 'pending',
        purpose: '纳米粒子合成实验所需酸碱试剂',
      },
      {
        applicantId: users[5].id,
        projectId: projects[1].id,
        status: 'approved',
        purpose: '药物合成反应溶剂采购',
        reviewerId: users[1].id,
        reviewComment: '同意采购，注意溶剂使用安全',
        reviewedAt: DateTime.fromISO('2024-09-15T10:30:00Z'),
      },
      {
        applicantId: users[4].id,
        projectId: projects[0].id,
        status: 'completed',
        purpose: '表征实验用化学试剂',
        reviewerId: users[2].id,
        reviewComment: '已批准',
        reviewedAt: DateTime.fromISO('2024-08-20T14:00:00Z'),
      },
    ])

    await RequisitionItem.createMany([
      {
        requisitionId: requisitions[0].id,
        reagentId: reagents[0].id,
        quantity: 5,
        unitPrice: 35.0,
      },
      {
        requisitionId: requisitions[0].id,
        reagentId: reagents[1].id,
        quantity: 3,
        unitPrice: 42.0,
      },
      {
        requisitionId: requisitions[1].id,
        reagentId: reagents[3].id,
        quantity: 10,
        unitPrice: 55.0,
      },
      {
        requisitionId: requisitions[1].id,
        reagentId: reagents[4].id,
        quantity: 5,
        unitPrice: 48.0,
      },
      {
        requisitionId: requisitions[2].id,
        reagentId: reagents[9].id,
        quantity: 2,
        unitPrice: 32.0,
      },
    ])

    const equipmentList = await Equipment.createMany([
      {
        name: '高效液相色谱仪',
        code: 'HPLC-001',
        status: 'active',
        ownerId: users[4].id,
        utilizationRate: 78.5,
        lastMaintenance: DateTime.fromISO('2024-07-10T08:00:00Z'),
        nextMaintenance: DateTime.fromISO('2025-01-10T08:00:00Z'),
      },
      {
        name: '气相色谱质谱联用仪',
        code: 'GCMS-001',
        status: 'active',
        ownerId: users[5].id,
        utilizationRate: 65.2,
        lastMaintenance: DateTime.fromISO('2024-06-15T08:00:00Z'),
        nextMaintenance: DateTime.fromISO('2024-12-15T08:00:00Z'),
      },
      {
        name: '紫外可见分光光度计',
        code: 'UV-001',
        status: 'active',
        ownerId: users[4].id,
        utilizationRate: 92.1,
        lastMaintenance: DateTime.fromISO('2024-08-20T08:00:00Z'),
        nextMaintenance: DateTime.fromISO('2025-02-20T08:00:00Z'),
      },
      {
        name: '分析天平',
        code: 'BAL-001',
        status: 'maintenance',
        ownerId: null,
        utilizationRate: 0,
        lastMaintenance: DateTime.fromISO('2024-09-01T08:00:00Z'),
        nextMaintenance: DateTime.fromISO('2024-10-01T08:00:00Z'),
      },
      {
        name: '旋转蒸发仪',
        code: 'ROT-001',
        status: 'active',
        ownerId: users[5].id,
        utilizationRate: 45.8,
        lastMaintenance: DateTime.fromISO('2024-05-10T08:00:00Z'),
        nextMaintenance: DateTime.fromISO('2024-11-10T08:00:00Z'),
      },
    ])

    await EquipmentAlert.createMany([
      {
        equipmentId: equipmentList[1].id,
        alertType: 'maintenance_due',
        message: 'GCMS-001 已到维护周期，请安排定期保养',
        status: 'pending',
        confirmedByAdmin: false,
        confirmedByOwner: false,
      },
      {
        equipmentId: equipmentList[3].id,
        alertType: 'malfunction',
        message: 'BAL-001 称量精度偏差超过允许范围，需要校准',
        status: 'confirmed_by_admin',
        confirmedByAdmin: true,
        confirmedByOwner: false,
        adminConfirmedAt: DateTime.fromISO('2024-09-02T09:00:00Z'),
      },
      {
        equipmentId: equipmentList[4].id,
        alertType: 'calibration_expired',
        message: 'ROT-001 校准证书已过期，需要重新校准',
        status: 'pending',
        confirmedByAdmin: false,
        confirmedByOwner: false,
      },
    ])

    await AuditLog.createMany([
      {
        operatorId: users[0].id,
        action: 'create',
        targetType: 'user',
        targetId: users[6].id,
        detail: '创建新用户孙实验员',
      },
      {
        operatorId: users[1].id,
        action: 'update',
        targetType: 'reagent',
        targetId: reagents[0].id,
        detail: '更新盐酸库存数量：100 -> 120',
      },
      {
        operatorId: users[1].id,
        action: 'create',
        targetType: 'reagent_batch',
        targetId: batches[1].id,
        detail: '新增盐酸批次 HCl-2024-002',
      },
      {
        operatorId: users[2].id,
        action: 'approve',
        targetType: 'requisition',
        targetId: requisitions[2].id,
        detail: '批准申请单：表征实验用化学试剂',
      },
    ])

    await OperationHistory.createMany([
      {
        operatorId: users[1].id,
        action: 'stock_in',
        targetType: 'reagent',
        targetName: '盐酸',
        detail: '入库 60 瓶，批次 HCl-2024-002',
      },
      {
        operatorId: users[4].id,
        action: 'stock_out',
        targetType: 'reagent',
        targetName: '无水乙醇',
        detail: '出库 10 瓶，用于药物合成反应',
        handoverNote: '已交接给刘实验员，签字确认',
      },
      {
        operatorId: users[0].id,
        action: 'role_change',
        targetType: 'user',
        targetName: '孙实验员',
        detail: '角色从 staff 变更为 reagent_manager',
      },
    ])

    await PermissionRequest.createMany([
      {
        userId: users[6].id,
        requestedRole: 'reagent_manager',
        reason: '需要管理试剂库存和批次信息',
        status: 'pending',
      },
    ])
  }
}
