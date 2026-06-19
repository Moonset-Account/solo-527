import { UserRole, OperationType } from '@prisma/client';

export const roleLabels: Record<UserRole, string> = {
  [UserRole.LEGAL_MANAGER]: '法务负责人',
  [UserRole.PRO_BONO_LAWYER]: '公益律师',
  [UserRole.REVIEWER]: '合同审阅人',
  [UserRole.ADMIN]: '系统管理员',
};

export const contractStatusLabels: Record<string, string> = {
  DRAFT: '草稿',
  PENDING_REVIEW: '待审阅',
  UNDER_REVIEW: '审阅中',
  REVISE_REQUESTED: '待修改',
  APPROVED: '已通过',
  STAMPED: '已盖章',
  COMPLETED: '已完成',
  REJECTED: '已驳回',
};

export const riskLevelLabels: Record<string, string> = {
  LOW: '低风险',
  MEDIUM: '中风险',
  HIGH: '高风险',
  CRITICAL: '严重风险',
};

export const reminderTypeLabels: Record<string, string> = {
  REVIEW_DEADLINE: '审阅截止提醒',
  STAMP_DEADLINE: '盖章节点提醒',
  MATERIAL_INCOMPLETE: '材料不完整提醒',
  RISK_ALERT: '风险预警',
  EFFICIENCY_REMINDER: '审阅效率提醒',
};

export const operationTypeLabels: Record<OperationType, string> = {
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

export const materialStatusLabels: Record<string, string> = {
  PENDING: '待上传',
  UPLOADED: '已上传',
  VERIFIED: '已验证',
  REJECTED: '已驳回',
};

export function cn(...classes: (string | boolean | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function formatDate(date: Date | string | null): string {
  if (!date) return '-';
  const d = new Date(date);
  return d.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}
