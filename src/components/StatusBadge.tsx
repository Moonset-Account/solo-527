import { cn } from '@/lib/utils'

type BadgeType = 'farm-record' | 'harvest' | 'sorting' | 'order' | 'declaration' | 'plot' | 'variety'

interface StatusBadgeProps {
  status: string
  type: BadgeType
}

const colorMap: Record<BadgeType, Record<string, string>> = {
  'farm-record': {
    planned: 'bg-blue-100 text-blue-700',
    in_progress: 'bg-amber-100 text-amber-700',
    completed: 'bg-green-100 text-green-700',
    cancelled: 'bg-gray-100 text-gray-500',
  },
  harvest: {
    pending: 'bg-amber-100 text-amber-700',
    confirmed: 'bg-blue-100 text-blue-700',
    sorted: 'bg-purple-100 text-purple-700',
    completed: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
  },
  sorting: {
    pending: 'bg-amber-100 text-amber-700',
    sorting: 'bg-blue-100 text-blue-700',
    completed: 'bg-green-100 text-green-700',
    inspected: 'bg-purple-100 text-purple-700',
    cancelled: 'bg-gray-100 text-gray-500',
  },
  order: {
    pending: 'bg-amber-100 text-amber-700',
    processing: 'bg-blue-100 text-blue-700',
    shipped: 'bg-purple-100 text-purple-700',
    delivered: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700',
    returned: 'bg-gray-100 text-gray-500',
  },
  declaration: {
    complete: 'bg-green-100 text-green-700',
    missing: 'bg-red-100 text-red-700',
    processing: 'bg-blue-100 text-blue-700',
  },
  plot: {
    active: 'bg-green-100 text-green-700',
    fallow: 'bg-amber-100 text-amber-700',
    preparing: 'bg-blue-100 text-blue-700',
  },
  variety: {
    active: 'bg-green-100 text-green-700',
    inactive: 'bg-gray-100 text-gray-500',
  },
}

const statusLabelMap: Record<string, string> = {
  planned: '已计划',
  in_progress: '进行中',
  sorting: '分拣中',
  inspected: '已质检',
  completed: '已完成',
  cancelled: '已取消',
  pending: '待处理',
  confirmed: '已确认',
  sorted: '已分拣',
  rejected: '已驳回',
  processing: '处理中',
  shipped: '已发货',
  delivered: '已送达',
  returned: '已退回',
  draft: '草稿',
  submitted: '已提交',
  approved: '已通过',
  complete: '齐全',
  missing: '缺失',
  active: '种植中',
  fallow: '休耕',
  preparing: '备耕',
  inactive: '停用',
}

export default function StatusBadge({ status, type }: StatusBadgeProps) {
  const colors = colorMap[type]?.[status] || 'bg-gray-100 text-gray-600'
  const label = statusLabelMap[status] || status

  return (
    <span className={cn('status-badge', colors)}>
      {label}
    </span>
  )
}
