import {
  UserRole,
  OperationType,
  ContractStatus,
  RiskLevel,
  ReminderType,
  MaterialStatus,
  ReminderChannel,
} from '@prisma/client';

export const roleLabels: Readonly<Record<UserRole, string>> = {
  [UserRole.LEGAL_MANAGER]: '法务负责人',
  [UserRole.PRO_BONO_LAWYER]: '公益律师',
  [UserRole.REVIEWER]: '合同审阅人',
  [UserRole.ADMIN]: '系统管理员',
};

export const contractStatusLabels: Readonly<Record<ContractStatus, string>> = {
  [ContractStatus.DRAFT]: '草稿',
  [ContractStatus.PENDING_REVIEW]: '待审阅',
  [ContractStatus.UNDER_REVIEW]: '审阅中',
  [ContractStatus.REVISE_REQUESTED]: '待修改',
  [ContractStatus.APPROVED]: '已通过',
  [ContractStatus.STAMPED]: '已盖章',
  [ContractStatus.COMPLETED]: '已完成',
  [ContractStatus.REJECTED]: '已驳回',
};

export const riskLevelLabels: Readonly<Record<RiskLevel, string>> = {
  [RiskLevel.LOW]: '低风险',
  [RiskLevel.MEDIUM]: '中风险',
  [RiskLevel.HIGH]: '高风险',
  [RiskLevel.CRITICAL]: '严重风险',
};

export const reminderTypeLabels: Readonly<Record<ReminderType, string>> = {
  [ReminderType.REVIEW_DEADLINE]: '审阅截止提醒',
  [ReminderType.STAMP_DEADLINE]: '盖章节点提醒',
  [ReminderType.MATERIAL_INCOMPLETE]: '材料不完整提醒',
  [ReminderType.RISK_ALERT]: '风险预警',
  [ReminderType.EFFICIENCY_REMINDER]: '审阅效率提醒',
};

export const operationTypeLabels: Readonly<Record<OperationType, string>> = {
  [OperationType.UPLOAD]: '上传合同',
  [OperationType.VIEW]: '查看合同',
  [OperationType.REVIEW]: '审阅合同',
  [OperationType.APPROVE]: '审批通过',
  [OperationType.REJECT]: '审批驳回',
  [OperationType.DOWNLOAD]: '下载合同',
  [OperationType.STAMP]: '盖章操作',
  [OperationType.UPDATE_RULE]: '更新提醒规则',
  [OperationType.UPDATE_PERMISSION]: '更新权限',
  [OperationType.RISK_FLAG]: '风险标记',
};

export const materialStatusLabels: Readonly<Record<MaterialStatus, string>> = {
  [MaterialStatus.PENDING]: '待上传',
  [MaterialStatus.UPLOADED]: '已上传',
  [MaterialStatus.VERIFIED]: '已验证',
  [MaterialStatus.REJECTED]: '已驳回',
};

export const reminderChannelLabels: Readonly<Record<ReminderChannel, string>> = {
  [ReminderChannel.SYSTEM]: '系统通知',
  [ReminderChannel.EMAIL]: '邮件',
  [ReminderChannel.SMS]: '短信',
};

export function getContractStatusLabel(status: string): string {
  return (contractStatusLabels as Record<string, string>)[status] || status;
}

export function getRiskLevelLabel(level: string | null): string {
  if (!level) return '未评估';
  return (riskLevelLabels as Record<string, string>)[level] || level;
}

export function getReminderTypeLabel(type: string): string {
  return (reminderTypeLabels as Record<string, string>)[type] || type;
}

export function getMaterialStatusLabel(status: string): string {
  return (materialStatusLabels as Record<string, string>)[status] || status;
}

export function getReminderChannelLabel(channel: string): string {
  return (reminderChannelLabels as Record<string, string>)[channel] || channel;
}

export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '-';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatFileSize(bytes: number | null | undefined): string {
  if (!bytes || bytes <= 0) return '0 B';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}
