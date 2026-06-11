export const formatDate = (iso: string | null | undefined): string => {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  } catch {
    return '—';
  }
};

export const formatDateTime = (iso: string | null | undefined): string => {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    return `${formatDate(iso)} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  } catch {
    return '—';
  }
};

export const daysFromNow = (iso: string): number => {
  const diff = new Date(iso).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

export const materialAuthLabel: Record<string, string> = {
  pending: '待审核',
  approved: '已通过',
  rejected: '已驳回'
};

export const materialAuthClass: Record<string, string> = {
  pending: 'bg-amber-gold-100 text-amber-gold-700',
  approved: 'bg-success-green-100 text-success-green-700',
  rejected: 'bg-warn-orange-100 text-warn-orange-700'
};

export const subscriptionStatusLabel: Record<string, string> = {
  active: '有效中',
  expiring: '即将到期',
  expired: '已过期',
  cancelled: '已取消'
};

export const subscriptionStatusClass: Record<string, string> = {
  active: 'bg-success-green-100 text-success-green-700',
  expiring: 'bg-amber-gold-100 text-amber-gold-700',
  expired: 'bg-navy-100 text-navy-600',
  cancelled: 'bg-warn-orange-100 text-warn-orange-700'
};

export const invoiceCycleLabel: Record<string, string> = {
  monthly: '月结',
  quarterly: '季结',
  yearly: '年结'
};

export const invoiceCycleClass: Record<string, string> = {
  monthly: 'bg-navy-100 text-navy-700',
  quarterly: 'bg-navy-100 text-navy-700',
  yearly: 'bg-navy-100 text-navy-700'
};

export const planTypeLabel: Record<string, string> = {
  monthly: '月度会员',
  quarterly: '季度会员',
  yearly: '年度会员'
};

export const priorityLabel: Record<string, string> = {
  high: '高优先',
  medium: '中优先',
  low: '低优先'
};

export const priorityClass: Record<string, string> = {
  high: 'bg-warn-orange-100 text-warn-orange-700',
  medium: 'bg-amber-gold-100 text-amber-gold-700',
  low: 'bg-navy-100 text-navy-600'
};

export const todoTypeLabel: Record<string, string> = {
  material_auth: '素材授权',
  invoice_cycle: '发票周期',
  subscription: '会员订阅'
};

export const todoStatusLabel: Record<string, string> = {
  pending: '待处理',
  processing: '处理中',
  done: '已完成'
};

export const todoStatusClass: Record<string, string> = {
  pending: 'bg-warn-orange-100 text-warn-orange-700',
  processing: 'bg-amber-gold-100 text-amber-gold-700',
  done: 'bg-success-green-100 text-success-green-700'
};

export const exceptionStatusLabel: Record<string, string> = {
  unconfirmed: '未确认',
  confirmed: '已确认',
  resolved: '已办结'
};

export const exceptionStatusClass: Record<string, string> = {
  unconfirmed: 'bg-warn-orange-100 text-warn-orange-700',
  confirmed: 'bg-amber-gold-100 text-amber-gold-700',
  resolved: 'bg-success-green-100 text-success-green-700'
};

export const orderStatusLabel: Record<string, string> = {
  pending: '待支付',
  paid: '已支付',
  delivering: '交付中',
  completed: '已完成',
  refunded: '已退款'
};

export const orderStatusClass: Record<string, string> = {
  pending: 'bg-navy-100 text-navy-700',
  paid: 'bg-amber-gold-100 text-amber-gold-700',
  delivering: 'bg-success-green-100 text-success-green-700',
  completed: 'bg-success-green-100 text-success-green-700',
  refunded: 'bg-warn-orange-100 text-warn-orange-700'
};

export const deliveryStatusLabel: Record<string, string> = {
  pending: '待开始',
  in_progress: '进行中',
  completed: '已完成'
};

export const deliveryStatusClass: Record<string, string> = {
  pending: 'bg-navy-100 text-navy-600',
  in_progress: 'bg-amber-gold-100 text-amber-gold-700',
  completed: 'bg-success-green-100 text-success-green-700'
};

export const alertStatusLabel: Record<string, string> = {
  active: '预警中',
  acknowledged: '已认领',
  resolved: '已解决'
};

export const alertStatusClass: Record<string, string> = {
  active: 'bg-warn-orange-100 text-warn-orange-700',
  acknowledged: 'bg-amber-gold-100 text-amber-gold-700',
  resolved: 'bg-success-green-100 text-success-green-700'
};

export const getInitials = (name: string): string => {
  if (!name) return '?';
  return name.slice(0, 1);
};
