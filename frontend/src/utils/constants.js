export const PURCHASE_STATUS = {
  DRAFT: { label: '草稿', color: 'default' },
  PENDING_SUPPLIER: { label: '待供应商确认', color: 'processing' },
  SUPPLIER_CONFIRMED: { label: '供应商已确认', color: 'cyan' },
  PARTIAL_DELIVERED: { label: '部分到货', color: 'warning' },
  FULLY_DELIVERED: { label: '全部到货', color: 'blue' },
  CANCELLED: { label: '已取消', color: 'error' },
  COMPLETED: { label: '已完成', color: 'success' },
};

export const INBOUND_STATUS = {
  PENDING: { label: '待收货', color: 'default' },
  QC_PENDING: { label: '待质检', color: 'processing' },
  QC_PASSED: { label: '质检通过', color: 'cyan' },
  QC_REJECTED: { label: '质检不合格', color: 'error' },
  COMPLETED: { label: '已完成', color: 'success' },
  CANCELLED: { label: '已取消', color: 'default' },
};

export const OUTBOUND_STATUS = {
  PENDING: { label: '待拣货', color: 'default' },
  PICKING: { label: '拣货中', color: 'processing' },
  SHIPPED: { label: '已发货', color: 'cyan' },
  COMPLETED: { label: '已完成', color: 'success' },
  CANCELLED: { label: '已取消', color: 'error' },
};

export const EXCEPTION_TYPE = {
  QC_REJECT: { label: '质检不合格', color: 'red', cls: 'red' },
  NEAR_EXPIRY: { label: '效期临近', color: 'orange', cls: 'orange' },
  EXPIRED: { label: '已过期', color: 'red', cls: 'red' },
  INVENTORY_MISMATCH: { label: '库存差异', color: 'purple', cls: 'purple' },
  DELIVERY_DELAY: { label: '送货延迟', color: 'orange', cls: 'orange' },
  SHORT_DELIVERY: { label: '少送', color: 'magenta', cls: 'magenta' },
  OVER_DELIVERY: { label: '多送', color: 'cyan', cls: 'cyan' },
  BATCH_ERROR: { label: '批次错误', color: 'gold', cls: 'orange' },
  OTHER: { label: '其他', color: 'default', cls: 'grey' },
};

export const EXCEPTION_STATUS = {
  OPEN: { label: '待处理', color: 'red' },
  IN_PROGRESS: { label: '处理中', color: 'processing' },
  PENDING_SUPPLIER: { label: '待供应商响应', color: 'warning' },
  RESOLVED: { label: '已解决', color: 'cyan' },
  CLOSED: { label: '已关闭', color: 'default' },
  ESCALATED: { label: '已升级', color: 'magenta' },
};

export const BATCH_STATUS = {
  NORMAL: { label: '正常', color: 'green' },
  NEAR_EXPIRY: { label: '效期临近', color: 'orange' },
  EXPIRED: { label: '已过期', color: 'red' },
  LOCKED: { label: '已锁定', color: 'blue' },
  DAMAGED: { label: '已报损', color: 'purple' },
};

export const QC_STATUS = {
  PENDING: { label: '待检', color: 'default' },
  PASSED: { label: '合格', color: 'green' },
  FAILED: { label: '不合格', color: 'red' },
  PARTIAL: { label: '部分合格', color: 'orange' },
};

export const BATCH_OP_STATUS = {
  PENDING_CONFIRM: { label: '待确认', color: 'warning' },
  PROCESSING: { label: '处理中', color: 'processing' },
  PARTIAL_SUCCESS: { label: '部分成功', color: 'orange' },
  COMPLETED: { label: '全部成功', color: 'success' },
  FAILED: { label: '全部失败', color: 'error' },
};

export const ALERT_TYPE = {
  LOW_STOCK: { label: '低库存', color: 'red', icon: 'Stock' },
  NEAR_EXPIRY: { label: '效期临近', color: 'orange', icon: 'ClockCircle' },
  EXPIRED: { label: '已过期', color: 'red', icon: 'Warning' },
  QC_EXCEPTION: { label: '质检异常', color: 'purple', icon: 'Alert' },
  SUPPLIER_REPLY: { label: '供应商回复', color: 'blue', icon: 'Message' },
  PURCHASE_FOLLOWUP: { label: '采购跟进', color: 'cyan', icon: 'Shopping' },
};

export const OUTBOUND_TYPES = {
  SALE: '销售出库',
  TRANSFER: '调拨出库',
  DONATE: '捐赠出库',
  SAMPLE: '样品出库',
  RETURN: '退货出库',
  LOSS: '报损出库',
  OTHER: '其他出库',
};

export const BATCH_OP_TYPES = {
  PRICE_UPDATE: { label: '批量改价', color: 'blue' },
  BATCH_STATUS_UPDATE: { label: '批次状态更新', color: 'orange' },
  STOCK_ADJUST: { label: '库存调整', color: 'cyan' },
  STOCKTAKE_CONFIRM: { label: '盘点确认', color: 'purple' },
  REASSIGN_SUPPLIER: { label: '重新分配供应商', color: 'green' },
  BATCH_CREATE_EXCEPTION: { label: '批量标记异常', color: 'red' },
  SUPPLIER_RATE_BATCH: { label: '批量评分', color: 'magenta' },
};

export const URGENT_LEVEL = {
  1: { label: '普通', color: 'default' },
  2: { label: '一般', color: 'blue' },
  3: { label: '加急', color: 'orange' },
  4: { label: '特急', color: 'red' },
};
