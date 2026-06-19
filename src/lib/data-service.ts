import { prisma } from './prisma';
import { db as mockDb } from './mock-db';
import { pushReminderQueue } from './redis';
import {
  ContractStatus,
  RiskLevel,
  OperationType,
  ReminderType,
  MaterialStatus,
  type Prisma,
} from '@prisma/client';

let usePrisma = true;

async function checkPrisma(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}

export async function getDataService() {
  if (usePrisma) {
    const ok = await checkPrisma();
    if (!ok) usePrisma = false;
  }
  return usePrisma ? prismaService : mockService;
}

async function logOperation(
  operationType: OperationType,
  userId: string,
  description: string,
  contractId?: string,
  ipAddress?: string
) {
  try {
    if (usePrisma) {
      await prisma.operationLog.create({
        data: {
          operationType,
          userId,
          description,
          contractId,
          ipAddress,
        },
      });
    } else {
      mockDb.operationLogs.create({
        data: {
          operationType,
          userId,
          description,
          contractId,
          ipAddress,
        },
      });
    }
  } catch {
    // 日志写入失败不阻断主流程
  }
}

async function pushReminder(
  type: string,
  userId: string,
  title: string,
  message: string,
  contractId?: string
) {
  try {
    await pushReminderQueue({ type, userId, title, message, contractId });

    if (usePrisma) {
      await prisma.reminder.create({
        data: {
          type: type as ReminderType,
          userId,
          contractId,
          title,
          message,
          isRead: false,
          isSent: true,
          sentAt: new Date(),
        },
      });
    } else {
      mockDb.reminders.create({
        data: {
          type: type as ReminderType,
          userId,
          contractId,
          title,
          message,
          isRead: false,
          isSent: true,
          sentAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        },
      });
    }
  } catch {
    // 提醒发送失败不阻断主流程
  }
}

export interface DataService {
  getContracts: (params?: {
    status?: ContractStatus;
    assigneeId?: string;
    uploaderId?: string;
    materialComplete?: boolean;
    take?: number;
  }) => Promise<any[]>;
  getContractById: (id: string) => Promise<any | null>;
  countContracts: (params?: {
    status?: ContractStatus;
    assigneeId?: string;
    materialComplete?: boolean;
  }) => Promise<number>;
  createContract: (data: {
    title: string;
    contractNumber?: string;
    description?: string;
    fileUrl: string;
    fileName: string;
    fileSize: number;
    deadline?: Date;
    uploaderId: string;
    assigneeId?: string;
  }) => Promise<any>;
  updateContract: (id: string, data: any, options?: {
    actorUserId?: string;
    operationType?: OperationType;
    description?: string;
  }) => Promise<any>;
  getContractReviews: (contractId: string) => Promise<any[]>;
  createContractReview: (data: {
    contractId: string;
    reviewerId: string;
    comment: string;
    suggestions?: string;
    riskLevel?: RiskLevel;
    isApproved?: boolean;
  }) => Promise<any>;
  getContractMaterials: (contractId: string) => Promise<any[]>;
  countMaterials: (contractId: string, status?: MaterialStatus) => Promise<number>;
  createMaterial: (data: {
    contractId: string;
    name: string;
    fileUrl: string;
    fileType: string;
    description?: string;
    uploaderId: string;
  }) => Promise<any>;
  updateMaterial: (id: string, data: any) => Promise<any>;
  getStampNodes: (contractId: string) => Promise<any[]>;
  completeStampNode: (id: string, userId: string, remark?: string) => Promise<any>;
  getReminders: (params?: {
    userId?: string;
    isRead?: boolean;
    contractId?: string;
    take?: number;
  }) => Promise<any[]>;
  countReminders: (params?: { userId?: string; isRead?: boolean }) => Promise<number>;
  markReminderRead: (id: string) => Promise<any>;
  getReminderRules: (params?: { isEnabled?: boolean; type?: ReminderType }) => Promise<any[]>;
  toggleReminderRule: (id: string, isEnabled: boolean, actorUserId: string) => Promise<any>;
  createReminderRule: (data: any, actorUserId: string) => Promise<any>;
  updateReminderRule: (id: string, data: any, actorUserId: string) => Promise<any>;
  getRolePermissions: (role?: string) => Promise<any>;
  updateRolePermission: (role: string, data: any, actorUserId: string) => Promise<any>;
  getUsers: (params?: { role?: string }) => Promise<any[]>;
  getOperationLogs: (params?: {
    userId?: string;
    contractId?: string;
    operationType?: OperationType;
    take?: number;
  }) => Promise<any[]>;
  getEfficiencyStats: (userId?: string) => Promise<any[]>;
  recordDownload: (contractId: string, userId: string, fileName: string, ipAddress?: string) => Promise<any>;
  getDownloadRecords: (params?: { contractId?: string; userId?: string }) => Promise<any[]>;
  logOperation: (
    operationType: OperationType,
    userId: string,
    description: string,
    contractId?: string,
    ipAddress?: string
  ) => Promise<void>;
  pushReminder: (
    type: ReminderType | string,
    userId: string,
    title: string,
    message: string,
    contractId?: string
  ) => Promise<void>;
}

export const prismaService: DataService = {
  // ============ Contract ============
  async getContracts(params?: {
    status?: ContractStatus;
    assigneeId?: string;
    uploaderId?: string;
    materialComplete?: boolean;
    take?: number;
  }) {
    const where: Prisma.ContractWhereInput = {};
    if (params?.status) where.status = params.status;
    if (params?.assigneeId) where.assigneeId = params.assigneeId;
    if (params?.uploaderId) where.uploaderId = params.uploaderId;
    if (params?.materialComplete !== undefined) where.materialComplete = params.materialComplete;

    return prisma.contract.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: params?.take,
      include: {
        uploader: { select: { id: true, name: true, email: true, role: true } },
        assignee: { select: { id: true, name: true, email: true, role: true } },
      },
    });
  },

  async getContractById(id: string) {
    return prisma.contract.findUnique({
      where: { id },
      include: {
        uploader: { select: { id: true, name: true, email: true, role: true } },
        assignee: { select: { id: true, name: true, email: true, role: true } },
        reviews: {
          include: { reviewer: { select: { id: true, name: true, role: true } } },
          orderBy: { createdAt: 'desc' },
        },
        evidenceMaterials: true,
        stampNodes: { orderBy: { orderIndex: 'asc' } },
        downloadRecords: {
          include: { user: { select: { id: true, name: true } } },
          orderBy: { downloadAt: 'desc' },
        },
      },
    });
  },

  async countContracts(params?: {
    status?: ContractStatus;
    assigneeId?: string;
    materialComplete?: boolean;
  }) {
    const where: Prisma.ContractWhereInput = {};
    if (params?.status) where.status = params.status;
    if (params?.assigneeId) where.assigneeId = params.assigneeId;
    if (params?.materialComplete !== undefined) where.materialComplete = params.materialComplete;
    return prisma.contract.count({ where });
  },

  async createContract(data: {
    title: string;
    contractNumber?: string;
    description?: string;
    fileUrl: string;
    fileName: string;
    fileSize: number;
    deadline?: Date;
    uploaderId: string;
    assigneeId?: string;
  }) {
    const contract = await prisma.contract.create({
      data: {
        title: data.title,
        contractNumber: data.contractNumber,
        description: data.description,
        fileUrl: data.fileUrl,
        fileName: data.fileName,
        fileSize: data.fileSize,
        status: ContractStatus.DRAFT,
        deadline: data.deadline,
        uploaderId: data.uploaderId,
        assigneeId: data.assigneeId,
      },
    });

    await logOperation(
      OperationType.UPLOAD,
      data.uploaderId,
      `上传合同《${data.title}》`,
      contract.id
    );

    if (data.assigneeId) {
      await pushReminder(
        ReminderType.REVIEW_DEADLINE,
        data.assigneeId,
        '新合同待审阅',
        `您有新的待审阅合同：${data.title}`,
        contract.id
      );
    }

    return contract;
  },

  async updateContract(id: string, data: Prisma.ContractUpdateInput, options?: {
    actorUserId?: string;
    operationType?: OperationType;
    description?: string;
  }) {
    const updated = await prisma.contract.update({ where: { id }, data });

    if (options?.actorUserId && options.operationType) {
      await logOperation(
        options.operationType,
        options.actorUserId,
        options.description || `更新合同`,
        id
      );
    }

    return updated;
  },

  // ============ Review ============
  async getContractReviews(contractId: string) {
    return prisma.contractReview.findMany({
      where: { contractId },
      include: { reviewer: { select: { id: true, name: true, role: true } } },
      orderBy: { createdAt: 'desc' },
    });
  },

  async createContractReview(data: {
    contractId: string;
    reviewerId: string;
    comment: string;
    suggestions?: string;
    riskLevel?: RiskLevel;
    isApproved?: boolean;
  }) {
    const review = await prisma.contractReview.create({ data });

    const contract = await prisma.contract.findUnique({
      where: { id: data.contractId },
      select: { title: true, uploaderId: true },
    });

    if (contract) {
      await logOperation(
        data.isApproved === true
          ? OperationType.APPROVE
          : data.isApproved === false
            ? OperationType.REJECT
            : OperationType.REVIEW,
        data.reviewerId,
        data.isApproved === true
          ? `审批通过合同《${contract.title}》`
          : data.isApproved === false
            ? `审批驳回合同《${contract.title}》：${data.comment.substring(0, 30)}`
            : `审阅《${contract.title}》：${data.comment.substring(0, 30)}`,
        data.contractId
      );

      if (data.riskLevel === RiskLevel.HIGH || data.riskLevel === RiskLevel.CRITICAL) {
        const legalManagers = await prisma.user.findMany({
          where: { role: 'LEGAL_MANAGER' },
          select: { id: true },
        });
        for (const lm of legalManagers) {
          await pushReminder(
            ReminderType.RISK_ALERT,
            lm.id,
            '高风险合同预警',
            `《${contract.title}》被标记为${data.riskLevel === RiskLevel.CRITICAL ? '严重风险' : '高风险'}`,
            data.contractId
          );
        }
        await logOperation(
          OperationType.RISK_FLAG,
          data.reviewerId,
          `标记《${contract.title}》为${data.riskLevel === RiskLevel.CRITICAL ? '严重风险' : '高风险'}`,
          data.contractId
        );
      }

      if (contract.uploaderId) {
        await pushReminder(
          ReminderType.REVIEW_DEADLINE,
          contract.uploaderId,
          '收到审阅意见',
          `您上传的《${contract.title}》有新的审阅意见`,
          data.contractId
        );
      }
    }

    return review;
  },

  // ============ Material ============
  async getContractMaterials(contractId: string) {
    return prisma.evidenceMaterial.findMany({
      where: { contractId },
      include: {
        uploader: { select: { id: true, name: true } },
        verifier: { select: { id: true, name: true } },
      },
    });
  },

  async countMaterials(contractId: string, status?: MaterialStatus) {
    const where: Prisma.EvidenceMaterialWhereInput = { contractId };
    if (status) where.status = status;
    return prisma.evidenceMaterial.count({ where });
  },

  async createMaterial(data: {
    contractId: string;
    name: string;
    fileUrl: string;
    fileType: string;
    description?: string;
    uploaderId: string;
  }) {
    const material = await prisma.evidenceMaterial.create({
      data: {
        contractId: data.contractId,
        name: data.name,
        fileUrl: data.fileUrl,
        fileType: data.fileType,
        description: data.description,
        uploaderId: data.uploaderId,
        status: MaterialStatus.UPLOADED,
      },
    });

    await logOperation(
      OperationType.UPLOAD,
      data.uploaderId,
      `上传证据材料：${data.name}`,
      data.contractId
    );

    await prisma.contract.update({
      where: { id: data.contractId },
      data: { materialComplete: false },
    });

    const contract = await prisma.contract.findUnique({
      where: { id: data.contractId },
      select: { title: true, assigneeId: true },
    });

    if (contract?.assigneeId) {
      await pushReminder(
        ReminderType.MATERIAL_INCOMPLETE,
        contract.assigneeId,
        '新证据材料已上传',
        `《${contract.title}》有新证据材料：${data.name}，请验证`,
        data.contractId
      );
    }

    return material;
  },

  async updateMaterial(id: string, data: Prisma.EvidenceMaterialUpdateInput) {
    const material = await prisma.evidenceMaterial.update({ where: { id }, data });

    const allMaterials = await prisma.evidenceMaterial.findMany({
      where: { contractId: material.contractId },
    });
    const allVerified =
      allMaterials.length > 0 &&
      allMaterials.every((m) => m.status === MaterialStatus.VERIFIED);

    await prisma.contract.update({
      where: { id: material.contractId },
      data: { materialComplete: allVerified },
    });

    if (allVerified) {
      const contract = await prisma.contract.findUnique({
        where: { id: material.contractId },
        select: { title: true, uploaderId: true, assigneeId: true },
      });
      if (contract) {
        const notifyUsers = [contract.uploaderId, contract.assigneeId].filter(Boolean) as string[];
        for (const uid of notifyUsers) {
          await pushReminder(
            ReminderType.MATERIAL_INCOMPLETE,
            uid,
            '材料已完整',
            `《${contract.title}》所有证据材料已验证通过`,
            material.contractId
          );
        }
      }
    }

    return material;
  },

  // ============ Stamp ============
  async getStampNodes(contractId: string) {
    return prisma.stampNode.findMany({
      where: { contractId },
      include: { stampUser: { select: { id: true, name: true } } },
      orderBy: { orderIndex: 'asc' },
    });
  },

  async completeStampNode(id: string, userId: string, remark?: string) {
    const node = await prisma.stampNode.update({
      where: { id },
      data: {
        isCompleted: true,
        completedAt: new Date(),
        stampUserId: userId,
        remark,
      },
    });

    const contract = await prisma.contract.findUnique({
      where: { id: node.contractId },
      select: { title: true, uploaderId: true, assigneeId: true },
    });

    await logOperation(
      OperationType.STAMP,
      userId,
      `完成盖章节点：${node.nodeName}（${contract?.title || ''}）`,
      node.contractId
    );

    const allNodes = await prisma.stampNode.findMany({
      where: { contractId: node.contractId },
    });
    const allDone = allNodes.every((n) => n.isCompleted);

    if (allDone) {
      await prisma.contract.update({
        where: { id: node.contractId },
        data: { status: ContractStatus.STAMPED },
      });
    }

    if (contract) {
      const next = allNodes.find((n) => !n.isCompleted);
      const notify = [contract.uploaderId, contract.assigneeId].filter(Boolean) as string[];
      for (const uid of notify) {
        await pushReminder(
          ReminderType.STAMP_DEADLINE,
          uid,
          allDone ? '盖章全部完成' : `盖章节点完成：${node.nodeName}`,
          allDone
            ? `《${contract.title}》所有盖章节点已完成`
            : `《${contract.title}》下一节点：${next?.nodeName || '无'}`,
          node.contractId
        );
      }
    }

    return node;
  },

  // ============ Reminder ============
  async getReminders(params?: {
    userId?: string;
    isRead?: boolean;
    contractId?: string;
    take?: number;
  }) {
    const where: Prisma.ReminderWhereInput = {};
    if (params?.userId) where.userId = params.userId;
    if (params?.isRead !== undefined) where.isRead = params.isRead;
    if (params?.contractId) where.contractId = params.contractId;

    return prisma.reminder.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: params?.take,
      include: { contract: { select: { id: true, title: true } } },
    });
  },

  async countReminders(params?: { userId?: string; isRead?: boolean }) {
    const where: Prisma.ReminderWhereInput = {};
    if (params?.userId) where.userId = params.userId;
    if (params?.isRead !== undefined) where.isRead = params.isRead;
    return prisma.reminder.count({ where });
  },

  async markReminderRead(id: string) {
    return prisma.reminder.update({ where: { id }, data: { isRead: true } });
  },

  // ============ Reminder Rule ============
  async getReminderRules(params?: { isEnabled?: boolean; type?: ReminderType }) {
    const where: Prisma.ReminderRuleWhereInput = {};
    if (params?.isEnabled !== undefined) where.isEnabled = params.isEnabled;
    if (params?.type) where.type = params.type;
    return prisma.reminderRule.findMany({ where });
  },

  async toggleReminderRule(id: string, isEnabled: boolean, actorUserId: string) {
    const rule = await prisma.reminderRule.update({
      where: { id },
      data: { isEnabled },
    });
    await logOperation(
      OperationType.UPDATE_RULE,
      actorUserId,
      `${isEnabled ? '启用' : '停用'}提醒规则：${rule.name}`,
      undefined
    );
    return rule;
  },

  async createReminderRule(data: Prisma.ReminderRuleCreateInput, actorUserId: string) {
    const rule = await prisma.reminderRule.create({ data });
    await logOperation(
      OperationType.UPDATE_RULE,
      actorUserId,
      `创建提醒规则：${rule.name}`,
      undefined
    );
    return rule;
  },

  async updateReminderRule(id: string, data: Prisma.ReminderRuleUpdateInput, actorUserId: string) {
    const rule = await prisma.reminderRule.update({ where: { id }, data });
    await logOperation(
      OperationType.UPDATE_RULE,
      actorUserId,
      `更新提醒规则：${rule.name}`,
      undefined
    );
    return rule;
  },

  // ============ Permission ============
  async getRolePermissions(role?: string) {
    if (role) {
      return prisma.rolePermission.findUnique({ where: { role: role as any } });
    }
    return prisma.rolePermission.findMany();
  },

  async updateRolePermission(
    role: string,
    data: Prisma.RolePermissionUpdateInput,
    actorUserId: string
  ) {
    const perm = await prisma.rolePermission.update({
      where: { role: role as any },
      data,
    });
    await logOperation(
      OperationType.UPDATE_PERMISSION,
      actorUserId,
      `更新角色权限：${role}`,
      undefined
    );
    return perm;
  },

  // ============ User ============
  async getUsers(params?: { role?: string }) {
    const where: Prisma.UserWhereInput = {};
    if (params?.role) where.role = params.role as any;
    return prisma.user.findMany({ where });
  },

  // ============ Operation Log ============
  async getOperationLogs(params?: {
    userId?: string;
    contractId?: string;
    operationType?: OperationType;
    take?: number;
  }) {
    const where: Prisma.OperationLogWhereInput = {};
    if (params?.userId) where.userId = params.userId;
    if (params?.contractId) where.contractId = params.contractId;
    if (params?.operationType) where.operationType = params.operationType;

    return prisma.operationLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: params?.take,
      include: {
        user: { select: { id: true, name: true, role: true } },
        contract: { select: { id: true, title: true } },
      },
    });
  },

  // ============ Efficiency ============
  async getEfficiencyStats(userId?: string) {
    const where: Prisma.EfficiencyStatWhereInput = {};
    if (userId) where.userId = userId;
    return prisma.efficiencyStat.findMany({
      where,
      orderBy: { date: 'desc' },
      include: { user: { select: { id: true, name: true } } },
    });
  },

  // ============ Download ============
  async recordDownload(contractId: string, userId: string, fileName: string, ipAddress?: string) {
    const record = await prisma.downloadRecord.create({
      data: { contractId, userId, fileName, ipAddress },
    });

    const contract = await prisma.contract.findUnique({
      where: { id: contractId },
      select: { title: true },
    });

    await logOperation(
      OperationType.DOWNLOAD,
      userId,
      `下载《${contract?.title || fileName}》`,
      contractId,
      ipAddress
    );

    return record;
  },

  async getDownloadRecords(params?: { contractId?: string; userId?: string }) {
    const where: Prisma.DownloadRecordWhereInput = {};
    if (params?.contractId) where.contractId = params.contractId;
    if (params?.userId) where.userId = params.userId;
    return prisma.downloadRecord.findMany({
      where,
      orderBy: { downloadAt: 'desc' },
      include: { user: { select: { id: true, name: true } } },
    });
  },

  logOperation,
  pushReminder,
};

export const mockService: DataService = {
  getContracts: (params) => Promise.resolve(mockDb.contracts.findMany(params) as any),
  getContractById: (id) => Promise.resolve(mockDb.contracts.findUnique({ where: { id } }) as any),
  countContracts: (params) => Promise.resolve(mockDb.contracts.count(params)),
  createContract: async (data) => {
    const c = mockDb.contracts.create({
      data: { ...data, status: ContractStatus.DRAFT, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } as any,
    });
    await logOperation(OperationType.UPLOAD, data.uploaderId, `上传合同《${data.title}》`, c.id);
    if (data.assigneeId) {
      await pushReminder(ReminderType.REVIEW_DEADLINE, data.assigneeId, '新合同待审阅', `您有新的待审阅合同：${data.title}`, c.id);
    }
    return c as any;
  },
  updateContract: async (id, data, options) => {
    const updated = mockDb.contracts.update({ where: { id }, data }) as any;
    if (options?.actorUserId && options.operationType) {
      await logOperation(
        options.operationType,
        options.actorUserId,
        options.description || `更新合同`,
        id
      );
    }
    return updated;
  },
  getContractReviews: (contractId) => Promise.resolve(mockDb.contractReviews.findMany({ where: { contractId } }) as any),
  createContractReview: async (data) => {
    const r = mockDb.contractReviews.create({ data }) as any;
    const contract = mockDb.contracts.findUnique({ where: { id: data.contractId } }) as any;
    if (contract) {
      const opType = data.isApproved === true ? OperationType.APPROVE : data.isApproved === false ? OperationType.REJECT : OperationType.REVIEW;
      await logOperation(opType, data.reviewerId, `审阅《${contract.title}》：${data.comment.substring(0, 30)}`, data.contractId);
      if (data.riskLevel === RiskLevel.HIGH || data.riskLevel === RiskLevel.CRITICAL) {
        await pushReminder(ReminderType.RISK_ALERT, 'user-1', '高风险合同预警', `《${contract.title}》被标记为高风险`, data.contractId);
        await logOperation(OperationType.RISK_FLAG, data.reviewerId, `标记《${contract.title}》为高风险`, data.contractId);
      }
      if (contract.uploaderId) {
        await pushReminder(ReminderType.REVIEW_DEADLINE, contract.uploaderId, '收到审阅意见', `您上传的《${contract.title}》有新的审阅意见`, data.contractId);
      }
    }
    return r;
  },
  getContractMaterials: (contractId) => Promise.resolve(mockDb.evidenceMaterials.findMany({ where: { contractId } }) as any),
  countMaterials: (contractId, status) => Promise.resolve(mockDb.evidenceMaterials.count({ where: { contractId, status } } as any)),
  createMaterial: async (data) => {
    const m = mockDb.evidenceMaterials.create({
      data: { ...data, status: MaterialStatus.UPLOADED, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } as any,
    }) as any;
    mockDb.contracts.update({ where: { id: data.contractId }, data: { materialComplete: false } });
    await logOperation(
      OperationType.UPLOAD,
      data.uploaderId,
      `上传证据材料：${data.name}`,
      data.contractId
    );
    const contract = mockDb.contracts.findUnique({ where: { id: data.contractId } }) as any;
    if (contract?.assigneeId) {
      await pushReminder(
        ReminderType.MATERIAL_INCOMPLETE,
        contract.assigneeId,
        '新证据材料已上传',
        `《${contract.title}》有新证据材料：${data.name}，请验证`,
        data.contractId
      );
    }
    return m;
  },
  updateMaterial: async (id, data) => {
    const m = mockDb.evidenceMaterials.update({ where: { id }, data }) as any;
    const all = mockDb.evidenceMaterials.findMany({ where: { contractId: m.contractId } });
    const allVerified = all.length > 0 && all.every((mm: any) => mm.status === MaterialStatus.VERIFIED);
    mockDb.contracts.update({ where: { id: m.contractId }, data: { materialComplete: allVerified } });
    return m;
  },
  getStampNodes: (contractId) => Promise.resolve(mockDb.stampNodes.findMany({ where: { contractId } }) as any),
  completeStampNode: async (id, userId, remark) => {
    const n = mockDb.stampNodes.update({
      where: { id },
      data: { isCompleted: true, completedAt: new Date().toISOString(), stampUserId: userId, remark } as any,
    }) as any;
    await logOperation(OperationType.STAMP, userId, `完成盖章节点：${n.nodeName}`, n.contractId);
    const all = mockDb.stampNodes.findMany({ where: { contractId: n.contractId } });
    if (all.every((nn: any) => nn.isCompleted)) {
      mockDb.contracts.update({ where: { id: n.contractId }, data: { status: ContractStatus.STAMPED } });
    }
    return n;
  },
  getReminders: (params) => Promise.resolve(mockDb.reminders.findMany(params) as any),
  countReminders: (params) => Promise.resolve(mockDb.reminders.count(params)),
  markReminderRead: (id) => Promise.resolve(mockDb.reminders.update({ where: { id }, data: { isRead: true } }) as any),
  getReminderRules: (params) => Promise.resolve(mockDb.reminderRules.findMany(params) as any),
  toggleReminderRule: async (id, isEnabled, actorUserId) => {
    const r = mockDb.reminderRules.update({ where: { id }, data: { isEnabled } }) as any;
    await logOperation(OperationType.UPDATE_RULE, actorUserId, `${isEnabled ? '启用' : '停用'}提醒规则：${r.name}`);
    return r;
  },
  createReminderRule: async (data, actorUserId) => {
    const r = mockDb.reminderRules.create({ data: data as any }) as any;
    await logOperation(OperationType.UPDATE_RULE, actorUserId, `创建提醒规则：${r.name}`);
    return r;
  },
  updateReminderRule: async (id, data, actorUserId) => {
    const r = mockDb.reminderRules.update({ where: { id }, data }) as any;
    await logOperation(OperationType.UPDATE_RULE, actorUserId, `更新提醒规则：${r.name}`);
    return r;
  },
  getRolePermissions: (role) => Promise.resolve(role ? mockDb.rolePermissions.findUnique({ where: { role: role as any } }) : mockDb.rolePermissions.findMany()) as any,
  updateRolePermission: async (role, data, actorUserId) => {
    const p = mockDb.rolePermissions.update({ where: { role: role as any }, data }) as any;
    await logOperation(OperationType.UPDATE_PERMISSION, actorUserId, `更新角色权限：${role}`);
    return p;
  },
  getUsers: (params) => Promise.resolve(mockDb.users.findMany(params)) as any,
  getOperationLogs: (params) => Promise.resolve(mockDb.operationLogs.findMany(params)) as any,
  getEfficiencyStats: (userId) => Promise.resolve(mockDb.efficiencyStats.findMany(userId ? { where: { userId } } : undefined)) as any,
  recordDownload: async (contractId, userId, fileName, ipAddress) => {
    const r = mockDb.downloadRecords.create({ data: { contractId, userId, fileName, ipAddress, downloadAt: new Date().toISOString() } as any });
    await logOperation(OperationType.DOWNLOAD, userId, `下载${fileName}`, contractId, ipAddress);
    return r as any;
  },
  getDownloadRecords: (params) => Promise.resolve(mockDb.downloadRecords.findMany(params)) as any,
  logOperation,
  pushReminder,
};
