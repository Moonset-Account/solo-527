import {
  AlertStatus,
  AlertPriority,
  AlertType,
  AssetType,
  AssetStatus,
  BatchTaskStatus,
  BatchTaskType,
  UserRole,
  AuditActionType,
} from '../types';

export const alertStatusText: Record<AlertStatus, string> = {
  [AlertStatus.Pending]: '待处理',
  [AlertStatus.Assigned]: '已分派',
  [AlertStatus.Processing]: '处理中',
  [AlertStatus.Resolved]: '已解决',
  [AlertStatus.Closed]: '已关闭',
  [AlertStatus.Rollback]: '回滚中',
};

export const alertStatusColor: Record<AlertStatus, string> = {
  [AlertStatus.Pending]: 'default',
  [AlertStatus.Assigned]: 'processing',
  [AlertStatus.Processing]: 'processing',
  [AlertStatus.Resolved]: 'success',
  [AlertStatus.Closed]: 'success',
  [AlertStatus.Rollback]: 'warning',
};

export const alertPriorityText: Record<AlertPriority, string> = {
  [AlertPriority.Low]: '低',
  [AlertPriority.Medium]: '中',
  [AlertPriority.High]: '高',
  [AlertPriority.Critical]: '紧急',
};

export const alertPriorityColor: Record<AlertPriority, string> = {
  [AlertPriority.Low]: 'success',
  [AlertPriority.Medium]: 'default',
  [AlertPriority.High]: 'warning',
  [AlertPriority.Critical]: 'error',
};

export const alertTypeText: Record<AlertType, string> = {
  [AlertType.ServerDown]: '服务器宕机',
  [AlertType.HighCpu]: 'CPU使用率高',
  [AlertType.HighMemory]: '内存使用率高',
  [AlertType.DiskFull]: '磁盘空间不足',
  [AlertType.NetworkIssue]: '网络问题',
  [AlertType.SecurityVulnerability]: '安全漏洞',
  [AlertType.ApplicationError]: '应用程序错误',
  [AlertType.DatabaseIssue]: '数据库问题',
};

export const assetTypeText: Record<AssetType, string> = {
  [AssetType.Server]: '服务器',
  [AssetType.NetworkDevice]: '网络设备',
  [AssetType.Database]: '数据库',
  [AssetType.Application]: '应用',
  [AssetType.Storage]: '存储',
};

export const assetStatusText: Record<AssetStatus, string> = {
  [AssetStatus.Active]: '运行中',
  [AssetStatus.Maintenance]: '维护中',
  [AssetStatus.Offline]: '离线',
  [AssetStatus.Decommissioned]: '已退役',
};

export const assetStatusColor: Record<AssetStatus, string> = {
  [AssetStatus.Active]: 'success',
  [AssetStatus.Maintenance]: 'warning',
  [AssetStatus.Offline]: 'default',
  [AssetStatus.Decommissioned]: 'default',
};

export const batchTaskStatusText: Record<BatchTaskStatus, string> = {
  [BatchTaskStatus.Pending]: '等待中',
  [BatchTaskStatus.Running]: '执行中',
  [BatchTaskStatus.Completed]: '已完成',
  [BatchTaskStatus.PartiallyFailed]: '部分失败',
  [BatchTaskStatus.Failed]: '失败',
  [BatchTaskStatus.Cancelled]: '已取消',
};

export const batchTaskStatusColor: Record<BatchTaskStatus, string> = {
  [BatchTaskStatus.Pending]: 'default',
  [BatchTaskStatus.Running]: 'processing',
  [BatchTaskStatus.Completed]: 'success',
  [BatchTaskStatus.PartiallyFailed]: 'warning',
  [BatchTaskStatus.Failed]: 'error',
  [BatchTaskStatus.Cancelled]: 'default',
};

export const batchTaskTypeText: Record<BatchTaskType, string> = {
  [BatchTaskType.BulkAssignAlert]: '批量分派告警',
  [BatchTaskType.BulkCloseAlert]: '批量关闭告警',
  [BatchTaskType.BulkAssetSync]: '批量资产同步',
  [BatchTaskType.BulkVulnerabilityScan]: '批量漏洞扫描',
};

export const userRoleText: Record<UserRole, string> = {
  [UserRole.StoreOperator]: '门店运维',
  [UserRole.Admin]: '管理员',
};

export const auditActionTypeText: Record<AuditActionType, string> = {
  [AuditActionType.Create]: '创建',
  [AuditActionType.Update]: '更新',
  [AuditActionType.Delete]: '删除',
  [AuditActionType.Assign]: '分派',
  [AuditActionType.StatusChange]: '状态变更',
  [AuditActionType.Close]: '关闭',
  [AuditActionType.Rollback]: '回滚',
  [AuditActionType.VulnerabilityExtend]: '漏洞延期',
  [AuditActionType.AssetSync]: '资产同步',
  [AuditActionType.Login]: '登录',
  [AuditActionType.Logout]: '登出',
};

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '-';
  const d = new Date(date);
  return d.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDateShort(date: string | Date | null | undefined): string {
  if (!date) return '-';
  const d = new Date(date);
  return d.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}
