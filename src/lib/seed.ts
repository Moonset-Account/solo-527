import { prisma } from '@/lib/prisma';
import { UserRole, ContractStatus, RiskLevel, ReminderType, OperationType, MaterialStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

export async function seedDatabase() {
  const existingUsers = await prisma.user.findMany({ take: 1 });
  if (existingUsers.length > 0) {
    return { seeded: false, message: 'Database already seeded' };
  }

  const hashedPassword = await bcrypt.hash('password123', 10);

  const legalManager = await prisma.user.create({
    data: {
      email: 'legal@example.com',
      name: '张法务',
      passwordHash: hashedPassword,
      role: UserRole.LEGAL_MANAGER,
    },
  });

  const proBonoLawyer = await prisma.user.create({
    data: {
      email: 'probono@example.com',
      name: '李公益',
      passwordHash: hashedPassword,
      role: UserRole.PRO_BONO_LAWYER,
    },
  });

  const reviewer = await prisma.user.create({
    data: {
      email: 'reviewer@example.com',
      name: '王审阅',
      passwordHash: hashedPassword,
      role: UserRole.REVIEWER,
    },
  });

  const admin = await prisma.user.create({
    data: {
      email: 'admin@example.com',
      name: '系统管理员',
      passwordHash: hashedPassword,
      role: UserRole.ADMIN,
    },
  });

  await prisma.rolePermission.createMany({
    data: [
      {
        role: UserRole.LEGAL_MANAGER,
        canUpload: true,
        canReview: true,
        canApprove: true,
        canManageRules: true,
        canManageUsers: true,
        canViewDashboard: true,
        canDownload: true,
        canStamp: true,
        canViewLogs: true,
      },
      {
        role: UserRole.PRO_BONO_LAWYER,
        canUpload: true,
        canReview: true,
        canApprove: false,
        canManageRules: false,
        canManageUsers: false,
        canViewDashboard: true,
        canDownload: true,
        canStamp: false,
        canViewLogs: false,
      },
      {
        role: UserRole.REVIEWER,
        canUpload: false,
        canReview: true,
        canApprove: false,
        canManageRules: false,
        canManageUsers: false,
        canViewDashboard: false,
        canDownload: true,
        canStamp: false,
        canViewLogs: false,
      },
      {
        role: UserRole.ADMIN,
        canUpload: true,
        canReview: true,
        canApprove: true,
        canManageRules: true,
        canManageUsers: true,
        canViewDashboard: true,
        canDownload: true,
        canStamp: true,
        canViewLogs: true,
      },
    ],
  });

  const contracts = await Promise.all([
    prisma.contract.create({
      data: {
        title: '公益法律服务合作框架协议',
        contractNumber: 'GY-2024-001',
        description: '关于社区公益法律服务的框架合作协议，涉及多方权益保障',
        fileUrl: '/uploads/contract1.pdf',
        fileName: '公益法律服务合作框架协议.pdf',
        fileSize: 245678,
        status: ContractStatus.UNDER_REVIEW,
        riskLevel: RiskLevel.MEDIUM,
        riskDescription: '存在违约责任条款不明确的风险',
        deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        uploaderId: legalManager.id,
        assigneeId: proBonoLawyer.id,
      },
    }),
    prisma.contract.create({
      data: {
        title: '企业劳动合同模板修订版',
        contractNumber: 'LD-2024-015',
        description: '标准劳动合同模板，2024年度修订版本',
        fileUrl: '/uploads/contract2.pdf',
        fileName: '企业劳动合同模板.pdf',
        fileSize: 189023,
        status: ContractStatus.PENDING_REVIEW,
        riskLevel: RiskLevel.LOW,
        deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        uploaderId: legalManager.id,
        assigneeId: reviewer.id,
      },
    }),
    prisma.contract.create({
      data: {
        title: '房屋租赁合同-公益用途',
        contractNumber: 'ZF-2024-008',
        description: '社区服务中心办公场地租赁协议，公益性质',
        fileUrl: '/uploads/contract3.pdf',
        fileName: '房屋租赁合同.pdf',
        fileSize: 312456,
        status: ContractStatus.REVISE_REQUESTED,
        riskLevel: RiskLevel.HIGH,
        riskDescription: '租金调整条款存在重大漏洞，需重新评估',
        deadline: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
        uploaderId: proBonoLawyer.id,
        assigneeId: legalManager.id,
        materialComplete: false,
      },
    }),
    prisma.contract.create({
      data: {
        title: '捐赠协议-慈善基金会',
        contractNumber: 'JZ-2024-023',
        description: '某慈善基金会定向捐赠协议',
        fileUrl: '/uploads/contract4.pdf',
        fileName: '捐赠协议.pdf',
        fileSize: 156789,
        status: ContractStatus.APPROVED,
        riskLevel: RiskLevel.LOW,
        deadline: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        uploaderId: legalManager.id,
        assigneeId: proBonoLawyer.id,
        materialComplete: true,
      },
    }),
    prisma.contract.create({
      data: {
        title: '知识产权许可协议',
        contractNumber: 'ZS-2024-005',
        description: '软件著作权许可使用协议，涉及公益项目',
        fileUrl: '/uploads/contract5.pdf',
        fileName: '知识产权许可协议.pdf',
        fileSize: 278901,
        status: ContractStatus.DRAFT,
        uploaderId: proBonoLawyer.id,
        materialComplete: false,
      },
    }),
  ]);

  await Promise.all([
    prisma.contractReview.create({
      data: {
        contractId: contracts[0].id,
        reviewerId: proBonoLawyer.id,
        comment: '合同框架基本合理，但需补充服务质量评估标准条款。',
        suggestions: '建议增加第4.2条服务质量考核指标',
        riskLevel: RiskLevel.MEDIUM,
        isApproved: null,
      },
    }),
    prisma.contractReview.create({
      data: {
        contractId: contracts[2].id,
        reviewerId: legalManager.id,
        comment: '租金条款存在重大风险，建议重新谈判后再提交。',
        suggestions: '第3.1条年租金涨幅不得超过5%的条款需要修改',
        riskLevel: RiskLevel.HIGH,
        isApproved: false,
      },
    }),
    prisma.contractReview.create({
      data: {
        contractId: contracts[3].id,
        reviewerId: legalManager.id,
        comment: '捐赠协议合规，条款完整。',
        riskLevel: RiskLevel.LOW,
        isApproved: true,
      },
    }),
  ]);

  await prisma.reminderRule.createMany({
    data: [
      {
        name: '审阅截止前24小时提醒',
        type: ReminderType.REVIEW_DEADLINE,
        description: '在合同审阅截止日期前24小时发送提醒',
        isEnabled: true,
        beforeHours: 24,
      },
      {
        name: '材料不完整提醒',
        type: ReminderType.MATERIAL_INCOMPLETE,
        description: '当合同证据材料不完整时发送提醒',
        isEnabled: true,
        beforeHours: 0,
      },
      {
        name: '高风险合同预警',
        type: ReminderType.RISK_ALERT,
        description: '当合同被标记为高风险或严重风险时立即提醒',
        isEnabled: true,
        beforeHours: 0,
      },
      {
        name: '盖章节点提醒',
        type: ReminderType.STAMP_DEADLINE,
        description: '盖章节点前提醒相关人员',
        isEnabled: true,
        beforeHours: 12,
      },
      {
        name: '审阅效率提醒',
        type: ReminderType.EFFICIENCY_REMINDER,
        description: '当审阅时长超过平均水平时提醒',
        isEnabled: false,
        beforeHours: 0,
      },
    ],
  });

  await Promise.all([
    prisma.reminder.create({
      data: {
        type: ReminderType.REVIEW_DEADLINE,
        userId: proBonoLawyer.id,
        contractId: contracts[0].id,
        title: '审阅即将到期',
        message: '《公益法律服务合作框架协议》还有2天到期，请尽快处理',
        isRead: false,
      },
    }),
    prisma.reminder.create({
      data: {
        type: ReminderType.MATERIAL_INCOMPLETE,
        userId: legalManager.id,
        contractId: contracts[2].id,
        title: '材料不完整提醒',
        message: '《房屋租赁合同-公益用途》证据材料不完整，请补充相关材料',
        isRead: false,
      },
    }),
    prisma.reminder.create({
      data: {
        type: ReminderType.RISK_ALERT,
        userId: legalManager.id,
        contractId: contracts[2].id,
        title: '高风险预警',
        message: '《房屋租赁合同-公益用途》被标记为高风险，请重点关注',
        isRead: false,
      },
    }),
  ]);

  await Promise.all([
    prisma.evidenceMaterial.create({
      data: {
        contractId: contracts[0].id,
        name: '合作方资质证明',
        fileUrl: '/uploads/material1.pdf',
        fileType: 'application/pdf',
        status: MaterialStatus.VERIFIED,
        uploaderId: legalManager.id,
        verifierId: legalManager.id,
        verifiedAt: new Date(),
      },
    }),
    prisma.evidenceMaterial.create({
      data: {
        contractId: contracts[0].id,
        name: '项目立项批文',
        fileUrl: '/uploads/material2.pdf',
        fileType: 'application/pdf',
        status: MaterialStatus.UPLOADED,
        uploaderId: proBonoLawyer.id,
      },
    }),
    prisma.evidenceMaterial.create({
      data: {
        contractId: contracts[2].id,
        name: '房产证复印件',
        fileUrl: '/uploads/material3.pdf',
        fileType: 'application/pdf',
        status: MaterialStatus.PENDING,
        uploaderId: proBonoLawyer.id,
      },
    }),
  ]);

  await Promise.all([
    prisma.stampNode.create({
      data: {
        contractId: contracts[0].id,
        nodeName: '部门初审章',
        orderIndex: 1,
        isCompleted: true,
        completedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        stampUserId: legalManager.id,
      },
    }),
    prisma.stampNode.create({
      data: {
        contractId: contracts[0].id,
        nodeName: '法务审核章',
        orderIndex: 2,
        isCompleted: false,
      },
    }),
    prisma.stampNode.create({
      data: {
        contractId: contracts[0].id,
        nodeName: '公章',
        orderIndex: 3,
        isCompleted: false,
      },
    }),
  ]);

  await Promise.all([
    prisma.downloadRecord.create({
      data: {
        contractId: contracts[0].id,
        userId: proBonoLawyer.id,
        fileName: '公益法律服务合作框架协议.pdf',
      },
    }),
    prisma.downloadRecord.create({
      data: {
        contractId: contracts[0].id,
        userId: legalManager.id,
        fileName: '公益法律服务合作框架协议.pdf',
      },
    }),
  ]);

  const opTypes = [
    OperationType.UPLOAD, OperationType.VIEW, OperationType.REVIEW,
    OperationType.DOWNLOAD, OperationType.STAMP,
  ];

  const operationLogs = [];
  for (let i = 0; i < 20; i++) {
    operationLogs.push({
      operationType: opTypes[Math.floor(Math.random() * opTypes.length)],
      userId: [legalManager.id, proBonoLawyer.id, reviewer.id][Math.floor(Math.random() * 3)],
      contractId: contracts[Math.floor(Math.random() * contracts.length)].id,
      description: `操作记录 ${i + 1}`,
      createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
    });
  }
  await prisma.operationLog.createMany({ data: operationLogs });

  return { seeded: true, message: 'Database seeded successfully' };
}
