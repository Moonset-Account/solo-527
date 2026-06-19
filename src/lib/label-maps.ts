import type {
  AlertSeverity,
  AlertStatus,
  AssetStatus,
  AssetType,
  AuditAction,
  AuditEntity,
  InspectionStatus,
  RollbackStatus,
  UserRole,
  VulnerabilitySeverity,
  VulnerabilityStatus,
} from "@prisma/client";

export const ASSET_TYPE_LABELS: Record<AssetType, string> = {
  SERVER: "服务器",
  NETWORK_DEVICE: "网络设备",
  DATABASE: "数据库",
  STORAGE: "存储",
  APPLICATION: "应用系统",
  OTHER: "其他",
};

export const ASSET_STATUS_LABELS: Record<AssetStatus, { label: string; cls: string }> = {
  RUNNING: { label: "运行中", cls: "badge bg-success-100 text-success-600" },
  MAINTENANCE: { label: "维护中", cls: "badge bg-warning-100 text-warning-600" },
  STOPPED: { label: "已停止", cls: "badge bg-slate-100 text-slate-600" },
  DECOMMISSIONED: { label: "已下线", cls: "badge bg-slate-100 text-slate-500" },
};

export const ALERT_SEVERITY_LABELS: Record<AlertSeverity, { label: string; cls: string }> = {
  CRITICAL: { label: "严重", cls: "badge bg-danger-100 text-danger-600" },
  WARNING: { label: "警告", cls: "badge bg-warning-100 text-warning-600" },
  INFO: { label: "信息", cls: "badge bg-primary-100 text-primary-600" },
  LOW: { label: "低", cls: "badge bg-slate-100 text-slate-600" },
};

export const ALERT_STATUS_LABELS: Record<AlertStatus, { label: string; cls: string }> = {
  OPEN: { label: "待处理", cls: "badge bg-danger-100 text-danger-600" },
  ACKNOWLEDGED: { label: "已确认", cls: "badge bg-warning-100 text-warning-600" },
  IN_PROGRESS: { label: "处理中", cls: "badge bg-primary-100 text-primary-600" },
  RESOLVED: { label: "已解决", cls: "badge bg-success-100 text-success-600" },
  CLOSED: { label: "已关闭", cls: "badge bg-slate-100 text-slate-600" },
};

export const VULN_SEVERITY_LABELS: Record<VulnerabilitySeverity, { label: string; cls: string }> = {
  CRITICAL: { label: "严重", cls: "badge bg-danger-100 text-danger-600" },
  HIGH: { label: "高危", cls: "badge bg-warning-100 text-warning-600" },
  MEDIUM: { label: "中危", cls: "badge bg-primary-100 text-primary-600" },
  LOW: { label: "低危", cls: "badge bg-slate-100 text-slate-600" },
};

export const VULN_STATUS_LABELS: Record<VulnerabilityStatus, { label: string; cls: string }> = {
  IDENTIFIED: { label: "已发现", cls: "badge bg-danger-100 text-danger-600" },
  PATCHING: { label: "修复中", cls: "badge bg-warning-100 text-warning-600" },
  TESTING: { label: "验证中", cls: "badge bg-primary-100 text-primary-600" },
  RESOLVED: { label: "已解决", cls: "badge bg-success-100 text-success-600" },
  ACCEPTED_RISK: { label: "接受风险", cls: "badge bg-slate-100 text-slate-600" },
};

export const INSPECTION_STATUS_LABELS: Record<InspectionStatus, { label: string; cls: string }> = {
  PENDING: { label: "待执行", cls: "badge bg-warning-100 text-warning-600" },
  IN_PROGRESS: { label: "执行中", cls: "badge bg-primary-100 text-primary-600" },
  PASSED: { label: "已通过", cls: "badge bg-success-100 text-success-600" },
  FAILED: { label: "未通过", cls: "badge bg-danger-100 text-danger-600" },
  DEFERRED: { label: "已延期", cls: "badge bg-slate-100 text-slate-600" },
};

export const ROLLBACK_STATUS_LABELS: Record<RollbackStatus, { label: string; cls: string }> = {
  PLANNED: { label: "已计划", cls: "badge bg-slate-100 text-slate-600" },
  APPROVED: { label: "已审批", cls: "badge bg-primary-100 text-primary-600" },
  IN_PROGRESS: { label: "执行中", cls: "badge bg-warning-100 text-warning-600" },
  COMPLETED: { label: "已完成", cls: "badge bg-success-100 text-success-600" },
  CANCELLED: { label: "已取消", cls: "badge bg-slate-100 text-slate-500" },
  FAILED: { label: "失败", cls: "badge bg-danger-100 text-danger-600" },
};

export const USER_ROLE_LABELS: Record<UserRole, { label: string; cls: string }> = {
  ADMIN: { label: "管理员", cls: "badge bg-danger-100 text-danger-600" },
  IT_MANAGER: { label: "IT 主管", cls: "badge bg-primary-100 text-primary-600" },
  USER: { label: "值班工程师", cls: "badge bg-slate-100 text-slate-600" },
};

export const AUDIT_ACTION_LABELS: Record<AuditAction, { label: string; cls: string }> = {
  CREATE: { label: "创建", cls: "badge bg-success-100 text-success-600" },
  UPDATE: { label: "更新", cls: "badge bg-primary-100 text-primary-600" },
  DELETE: { label: "删除", cls: "badge bg-danger-100 text-danger-600" },
  APPROVE: { label: "审批", cls: "badge bg-warning-100 text-warning-600" },
  CONFIRM: { label: "确认", cls: "badge bg-success-100 text-success-700" },
  EXPORT: { label: "导出", cls: "badge bg-slate-100 text-slate-600" },
};

export const AUDIT_ENTITY_LABELS: Record<AuditEntity, string> = {
  ASSET: "资产",
  CONFIG_ITEM: "配置项",
  ALERT: "告警",
  VULNERABILITY: "漏洞",
  INSPECTION: "巡检",
  ROLLBACK_PLAN: "回滚方案",
  USER: "用户",
};

export function enumOptions<T extends Record<string, string>>(map: T) {
  return Object.entries(map).map(([value, label]) => ({
    value,
    label: typeof label === "string" ? label : (label as { label: string }).label,
  }));
}
