export const UserRole = {
  ADMIN: 'admin',
  PHOTOGRAPHER: 'photographer',
  BLOGGER: 'blogger',
  CLIENT: 'client',
} as const;

export type UserRoleType = (typeof UserRole)[keyof typeof UserRole];

export const OrderStatus = {
  PENDING_PAYMENT: 'pending_payment',
  PAID: 'paid',
  SELECTING: 'selecting',
  SELECTED_CONFIRMED: 'selected_confirmed',
  DELIVERING: 'delivering',
  DELIVERED: 'delivered',
  REVISING: 'revising',
  COMPLETED: 'completed',
  REFUNDING: 'refunding',
  REFUNDED: 'refunded',
  CANCELLED: 'cancelled',
} as const;

export const OrderStatusText: Record<string, string> = {
  pending_payment: '待付款',
  paid: '已付款',
  selecting: '选片中',
  selected_confirmed: '选片确认',
  delivering: '交付中',
  delivered: '已交付',
  revising: '修改中',
  completed: '已完成',
  refunding: '退款中',
  refunded: '已退款',
  cancelled: '已取消',
};

export const OrderStatusColor: Record<string, string> = {
  pending_payment: 'bg-yellow-100 text-yellow-800',
  paid: 'bg-blue-100 text-blue-800',
  selecting: 'bg-indigo-100 text-indigo-800',
  selected_confirmed: 'bg-purple-100 text-purple-800',
  delivering: 'bg-cyan-100 text-cyan-800',
  delivered: 'bg-green-100 text-green-800',
  revising: 'bg-orange-100 text-orange-800',
  completed: 'bg-emerald-100 text-emerald-800',
  refunding: 'bg-red-100 text-red-800',
  refunded: 'bg-gray-100 text-gray-800',
  cancelled: 'bg-gray-100 text-gray-600',
};

export const MaterialStatus = {
  DRAFT: 'draft',
  ON_SHELF: 'on_shelf',
  OFF_SHELF: 'off_shelf',
  ARCHIVED: 'archived',
};

export const MaterialStatusText: Record<string, string> = {
  draft: '草稿',
  on_shelf: '上架中',
  off_shelf: '已下架',
  archived: '已归档',
};

export const SettlementStatus = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PROCESSING: 'processing',
  PAID: 'paid',
  CANCELLED: 'cancelled',
  FAILED: 'failed',
};

export const SettlementStatusText: Record<string, string> = {
  pending: '待确认',
  confirmed: '已确认',
  processing: '处理中',
  paid: '已付款',
  cancelled: '已取消',
  failed: '失败',
};

export const ExceptionStatus = {
  OPEN: 'open',
  ASSIGNED: 'assigned',
  PROCESSING: 'processing',
  PENDING_REVIEW: 'pending_review',
  RESOLVED: 'resolved',
  CLOSED: 'closed',
};

export const ExceptionStatusText: Record<string, string> = {
  open: '待分配',
  assigned: '已分配',
  processing: '处理中',
  pending_review: '待审核',
  resolved: '已解决',
  closed: '已关闭',
};

export const ExceptionTypeText: Record<string, string> = {
  refund: '退款异常',
  delivery_delay: '交付延迟',
  quality_dispute: '质量纠纷',
  copyright: '版权问题',
  license_dispute: '授权纠纷',
  payment_error: '支付错误',
  other: '其他',
};

export const RefundStatusText: Record<string, string> = {
  none: '无',
  requested: '已申请',
  approving: '审批中',
  approved: '已同意',
  rejected: '已拒绝',
  partial: '部分退款',
  refunding: '退款中',
  refunded: '已退款',
};

export const DeliveryStatusText: Record<string, string> = {
  pending: '待提交',
  submitted: '已提交',
  client_reviewing: '客户审核中',
  accepted: '已通过',
  rejected: '已退回',
  revised: '已修改',
};

export const DeliveryTypeText: Record<string, string> = {
  initial: '初版',
  revision: '修改版',
  final: '终版',
  supplement: '补充',
};

export const TimelineEventTypeText: Record<string, string> = {
  order_created: '订单创建',
  payment_completed: '支付完成',
  selection_confirmed: '选片确认',
  delivery_submitted: '交付提交',
  delivery_accepted: '交付通过',
  delivery_rejected: '交付退回',
  revision_started: '开始修改',
  revision_completed: '修改完成',
  settlement_created: '结算创建',
  settlement_paid: '结算付款',
  exception_raised: '发起异常',
  exception_handled: '异常处理',
  order_completed: '订单完成',
  remark_added: '备注添加',
  status_changed: '状态变更',
  other: '其他',
};

export function formatDate(date: string | Date, fmt = 'YYYY-MM-DD HH:mm:ss'): string {
  if (!date) return '';
  const d = new Date(date);
  const map: Record<string, string> = {
    YYYY: d.getFullYear().toString(),
    MM: (d.getMonth() + 1).toString().padStart(2, '0'),
    DD: d.getDate().toString().padStart(2, '0'),
    HH: d.getHours().toString().padStart(2, '0'),
    mm: d.getMinutes().toString().padStart(2, '0'),
    ss: d.getSeconds().toString().padStart(2, '0'),
  };
  return fmt.replace(/YYYY|MM|DD|HH|mm|ss/g, (k) => map[k]);
}

export function formatMoney(num: number | string): string {
  if (num === undefined || num === null || num === '') return '0.00';
  return parseFloat(num.toString()).toFixed(2);
}

export function userRoleText(role: string): string {
  const map: Record<string, string> = {
    admin: '管理员',
    photographer: '摄影师',
    blogger: '知识博主',
    client: '客户',
  };
  return map[role] || role;
}
