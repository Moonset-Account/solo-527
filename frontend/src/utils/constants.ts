import type { TicketStatus, TicketPriority, TicketCategory } from '@/types';

export const TICKET_STATUS_MAP: Record<TicketStatus, { label: string; color: string }> = {
  open: { label: '待处理', color: 'warning' },
  pending: { label: '处理中', color: 'primary' },
  resolved: { label: '已解决', color: 'success' },
  closed: { label: '已关闭', color: 'secondary' },
};

export const TICKET_PRIORITY_MAP: Record<TicketPriority, { label: string; color: string }> = {
  low: { label: '低', color: 'secondary' },
  medium: { label: '中', color: 'primary' },
  high: { label: '高', color: 'warning' },
  urgent: { label: '紧急', color: 'danger' },
};

export const TICKET_CATEGORY_MAP: Record<TicketCategory, { label: string }> = {
  technical: { label: '技术问题' },
  billing: { label: '财务问题' },
  feature: { label: '功能需求' },
  other: { label: '其他' },
};

export const TICKET_STATUS_OPTIONS = Object.entries(TICKET_STATUS_MAP).map(([value, { label }]) => ({
  value,
  label,
}));

export const TICKET_PRIORITY_OPTIONS = Object.entries(TICKET_PRIORITY_MAP).map(([value, { label }]) => ({
  value,
  label,
}));

export const TICKET_CATEGORY_OPTIONS = Object.entries(TICKET_CATEGORY_MAP).map(([value, { label }]) => ({
  value,
  label,
}));

export const ROLE_MAP = {
  admin: { label: '管理员' },
  agent: { label: '客服' },
  user: { label: '普通用户' },
};

export const DATE_FORMAT = 'YYYY-MM-DD HH:mm:ss';
export const DATE_FORMAT_SHORT = 'YYYY-MM-DD';

export const PAGINATION_DEFAULT = {
  page: 1,
  pageSize: 10,
};

export const KNOWLEDGE_CATEGORIES = [
  { value: 'all', label: '全部分类' },
  { value: 'order', label: '订单相关' },
  { value: 'refund', label: '退款退货' },
  { value: 'product', label: '产品问题' },
  { value: 'account', label: '账户问题' },
  { value: 'other', label: '其他问题' },
];
