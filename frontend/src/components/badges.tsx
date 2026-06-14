import { clsx } from 'clsx';

export type WorkOrderStatus = 'pending' | 'material_ready' | 'in_progress' | 'completed' | 'delayed' | 'cancelled';
export type ProcessStatus = 'pending' | 'in_progress' | 'completed' | 'rework' | 'cancelled';
export type MaterialStatus = 'in_stock' | 'insufficient' | 'out_of_stock' | 'pending_arrival';
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export const workOrderStatusLabels: Record<WorkOrderStatus, string> = {
  pending: '待排产',
  material_ready: '物料齐套',
  in_progress: '生产中',
  completed: '已完成',
  delayed: '已延期',
  cancelled: '已取消',
};
export const workOrderStatusColors: Record<WorkOrderStatus, string> = {
  pending: 'bg-slate-100 text-slate-700',
  material_ready: 'bg-sky-100 text-sky-700',
  in_progress: 'bg-blue-100 text-blue-700',
  completed: 'bg-brand-100 text-brand-700',
  delayed: 'bg-amber-100 text-amber-700',
  cancelled: 'bg-slate-200 text-slate-500',
};

export const processStatusLabels: Record<ProcessStatus, string> = {
  pending: '待开始',
  in_progress: '进行中',
  completed: '已完成',
  rework: '返工中',
  cancelled: '已取消',
};
export const processStatusColors: Record<ProcessStatus, string> = {
  pending: 'bg-slate-100 text-slate-600',
  in_progress: 'bg-blue-100 text-blue-700',
  completed: 'bg-brand-100 text-brand-700',
  rework: 'bg-amber-100 text-amber-700',
  cancelled: 'bg-slate-200 text-slate-500',
};

export const materialStatusLabels: Record<MaterialStatus, string> = {
  in_stock: '库存充足',
  insufficient: '库存不足',
  out_of_stock: '缺货',
  pending_arrival: '待到货',
};
export const materialStatusColors: Record<MaterialStatus, string> = {
  in_stock: 'bg-brand-100 text-brand-700',
  insufficient: 'bg-amber-100 text-amber-700',
  out_of_stock: 'bg-red-100 text-red-700',
  pending_arrival: 'bg-violet-100 text-violet-700',
};

export const riskLabels: Record<RiskLevel, string> = {
  low: '低',
  medium: '中',
  high: '高',
  critical: '严重',
};
export const riskColors: Record<RiskLevel, string> = {
  low: 'bg-brand-100 text-brand-700',
  medium: 'bg-amber-100 text-amber-700',
  high: 'bg-orange-100 text-orange-700',
  critical: 'bg-red-100 text-red-700',
};
export const riskDotColors: Record<RiskLevel, string> = {
  low: 'bg-brand-500',
  medium: 'bg-amber-500',
  high: 'bg-orange-500',
  critical: 'bg-red-500',
};

export const kittingStatusLabels = {
  complete: '已齐套',
  alternative: '可替代',
  partial: '部分齐套',
  shortage: '缺料',
};
export const kittingStatusColors = {
  complete: 'bg-brand-100 text-brand-700 border-brand-200',
  alternative: 'bg-violet-100 text-violet-700 border-violet-200',
  partial: 'bg-amber-100 text-amber-700 border-amber-200',
  shortage: 'bg-red-100 text-red-700 border-red-200',
};

export function WorkOrderStatusBadge({ status }: { status: WorkOrderStatus }) {
  return (
    <span className={clsx('badge', workOrderStatusColors[status])}>
      {workOrderStatusLabels[status]}
    </span>
  );
}
export function ProcessStatusBadge({ status }: { status: ProcessStatus }) {
  return (
    <span className={clsx('badge', processStatusColors[status])}>
      {processStatusLabels[status]}
    </span>
  );
}
export function MaterialStatusBadge({ status }: { status: MaterialStatus }) {
  return (
    <span className={clsx('badge', materialStatusColors[status])}>
      {materialStatusLabels[status]}
    </span>
  );
}
export function RiskBadge({ level }: { level: RiskLevel }) {
  return (
    <span className={clsx('badge gap-1.5', riskColors[level])}>
      <span className={clsx('w-1.5 h-1.5 rounded-full', riskDotColors[level])} />
      {riskLabels[level]}风险
    </span>
  );
}
export function KittingStatusBadge({ status }: { status: keyof typeof kittingStatusLabels }) {
  return (
    <span className={clsx('badge border', kittingStatusColors[status])}>
      {kittingStatusLabels[status]}
    </span>
  );
}
