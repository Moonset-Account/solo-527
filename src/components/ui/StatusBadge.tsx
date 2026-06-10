import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: string;
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'muted';
  className?: string;
}

const statusVariantMap: Record<string, string> = {
  active: 'success',
  ACTIVE: 'success',
  paid: 'success',
  PAID: 'success',
  processed: 'success',
  PROCESSED: 'success',
  approved: 'success',
  APPROVED: 'success',
  converted: 'success',
  CONVERTED: 'success',
  
  trialing: 'warning',
  TRIALING: 'warning',
  pending: 'warning',
  PENDING: 'warning',
  open: 'warning',
  OPEN: 'warning',
  past_due: 'warning',
  PAST_DUE: 'warning',
  
  canceled: 'danger',
  CANCELED: 'danger',
  rejected: 'danger',
  REJECTED: 'danger',
  failed: 'danger',
  FAILED: 'danger',
  expired: 'danger',
  EXPIRED: 'danger',
  void: 'danger',
  VOID: 'danger',
  refunded: 'danger',
  REFUNDED: 'danger',
  uncollectible: 'danger',
  UNCOLLECTIBLE: 'danger',
  
  draft: 'muted',
  DRAFT: 'muted',
  inactive: 'muted',
  INACTIVE: 'muted',
  incomplete: 'muted',
  INCOMPLETE: 'muted',
  invited: 'info',
};

const statusLabelMap: Record<string, string> = {
  active: '活跃',
  ACTIVE: '活跃',
  trialing: '试用中',
  TRIALING: '试用中',
  canceled: '已取消',
  CANCELED: '已取消',
  past_due: '逾期',
  PAST_DUE: '逾期',
  unpaid: '未支付',
  UNPAID: '未支付',
  incomplete: '未完成',
  INCOMPLETE: '未完成',
  
  paid: '已支付',
  PAID: '已支付',
  pending: '待处理',
  PENDING: '待处理',
  open: '待支付',
  OPEN: '待支付',
  draft: '草稿',
  DRAFT: '草稿',
  void: '已作废',
  VOID: '已作废',
  refunded: '已退款',
  REFUNDED: '已退款',
  partially_refunded: '部分退款',
  PARTIALLY_REFUNDED: '部分退款',
  uncollectible: '坏账',
  UNCOLLECTIBLE: '坏账',
  
  approved: '已批准',
  APPROVED: '已批准',
  rejected: '已拒绝',
  REJECTED: '已拒绝',
  processed: '已处理',
  PROCESSED: '已处理',
  failed: '失败',
  FAILED: '失败',
  
  invited: '已邀请',
  activated: '已激活',
  active_member: '活跃',
  
  converted: '已转化',
  CONVERTED: '已转化',
  expired: '已过期',
  EXPIRED: '已过期',
  
  inactive: '未激活',
  INACTIVE: '未激活',
  archived: '已归档',
  ARCHIVED: '已归档',
};

export function StatusBadge({ status, variant, className = '' }: StatusBadgeProps) {
  const v = variant || (statusVariantMap[status] as 'success' | 'warning' | 'danger' | 'info' | 'muted') || 'muted';
  const label = statusLabelMap[status] || status;
  
  const variantClasses = {
    success: 'bg-success-50 text-success-600 border-success-200',
    warning: 'bg-warning-50 text-warning-600 border-warning-200',
    danger: 'bg-danger-50 text-danger-600 border-danger-200',
    info: 'bg-primary-50 text-primary-600 border-primary-200',
    muted: 'bg-slate-100 text-slate-600 border-slate-200',
  };
  
  const dotColors = {
    success: 'bg-success-500',
    warning: 'bg-warning-500',
    danger: 'bg-danger-500',
    info: 'bg-primary-500',
    muted: 'bg-slate-400',
  };
  
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full border',
      variantClasses[v],
      className
    )}>
      <span className={cn('w-1.5 h-1.5 rounded-full', dotColors[v])}></span>
      {label}
    </span>
  );
}

export default StatusBadge;
