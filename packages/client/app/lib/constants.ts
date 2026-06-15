import type {
  BatchStatus,
  InventoryStatus,
  LocationType,
  LocationStatus,
  SafetyStockStatus,
  AuditStatus,
  DiffType,
  TransferType,
  OperationType,
  TemperatureZone,
} from "@qinghe/shared";

export const temperatureZoneMap: Record<TemperatureZone, string> = {
  FROZEN: "冷冻",
  CHILLED: "冷藏",
  NORMAL: "常温",
};

export const batchStatusMap: Record<BatchStatus, { label: string; color: string }> = {
  RECEIVING: { label: "收货中", color: "blue" },
  QUALITY_CHECK: { label: "质检中", color: "cyan" },
  STORED: { label: "在库", color: "green" },
  PARTIAL_OUT: { label: "部分出库", color: "orange" },
  EXPIRED: { label: "已过期", color: "red" },
  SCRAPPED: { label: "已报废", color: "default" },
  EMPTY: { label: "已清空", color: "gray" },
};

export const inventoryStatusMap: Record<InventoryStatus, { label: string; color: string }> = {
  NORMAL: { label: "正常", color: "green" },
  LOCKED: { label: "锁定", color: "red" },
  RESERVED: { label: "已预留", color: "orange" },
  DAMAGED: { label: "损坏", color: "default" },
};

export const locationTypeMap: Record<LocationType, string> = {
  STORAGE: "存储区",
  PICKING: "拣选区",
  RECEIVING: "收货区",
  SHIPPING: "发货区",
  PROCESSING: "处理区",
  RETURN: "退货区",
};

export const locationStatusMap: Record<LocationStatus, { label: string; color: string }> = {
  ACTIVE: { label: "正常", color: "green" },
  INACTIVE: { label: "停用", color: "default" },
  FULL: { label: "已满", color: "orange" },
  LOCKED: { label: "锁定", color: "red" },
};

export const safetyStockStatusMap: Record<
  SafetyStockStatus,
  { label: string; color: string }
> = {
  NORMAL: { label: "正常", color: "green" },
  WARNING: { label: "预警", color: "orange" },
  CRITICAL: { label: "紧急", color: "red" },
};

export const auditStatusMap: Record<AuditStatus | "DELAYED", { label: string; color: string }> = {
  PENDING: { label: "待审批", color: "orange" },
  APPROVED: { label: "已批准", color: "blue" },
  REJECTED: { label: "已驳回", color: "red" },
  COMPLETED: { label: "已完成", color: "green" },
  DELAYED: { label: "已延误", color: "magenta" },
};

export const diffTypeMap: Record<DiffType, string> = {
  QUANTITY: "数量差异",
  QUALITY: "质量差异",
  DOCUMENT: "单据差异",
  OTHER: "其他差异",
};

export const transferTypeMap: Record<TransferType, string> = {
  ALLOCATION: "库位调拨",
  PURCHASE: "采购入库",
  RETURN: "退货调拨",
  EMERGENCY: "紧急补货",
};

export const operationTypeMap: Record<OperationType, string> = {
  INBOUND: "入库",
  OUTBOUND: "出库",
  TRANSFER: "调拨",
  ADJUST: "调整",
  COUNT: "盘点",
  SCRAP: "报废",
};

export const delayReasonCategoryMap: Record<string, string> = {
  SUPPLIER_DELAY: "供应商延迟",
  LOGISTICS_DELAY: "物流延迟",
  QUALITY_ISSUE: "质量问题",
  DOCUMENT_ISSUE: "单据问题",
  OTHER: "其他原因",
};
