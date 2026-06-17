import { cn } from '@/lib/utils'

const topicStatusConfig: Record<string, { label: string; className: string }> = {
  DRAFT: { label: '草稿', className: 'bg-slate-100 text-slate-700' },
  PUBLISHED: { label: '已发布', className: 'bg-blue-100 text-blue-700' },
  VOTING: { label: '投票中', className: 'bg-emerald-100 text-emerald-700' },
  CLOSED: { label: '已结束', className: 'bg-slate-100 text-slate-600' },
  CANCELLED: { label: '已取消', className: 'bg-rose-100 text-rose-700' },
}

const facilityStatusConfig: Record<string, { label: string; className: string }> = {
  NORMAL: { label: '正常', className: 'bg-emerald-100 text-emerald-700' },
  DAMAGED: { label: '损坏', className: 'bg-rose-100 text-rose-700' },
  UNDER_REPAIR: { label: '维修中', className: 'bg-amber-100 text-amber-700' },
  REPAIRED: { label: '已修复', className: 'bg-blue-100 text-blue-700' },
  RECTIFIED: { label: '已整改', className: 'bg-purple-100 text-purple-700' },
}

const damageStatusConfig: Record<string, { label: string; className: string }> = {
  PENDING: { label: '待处理', className: 'bg-rose-100 text-rose-700' },
  ASSIGNED: { label: '已分配', className: 'bg-amber-100 text-amber-700' },
  IN_PROGRESS: { label: '处理中', className: 'bg-blue-100 text-blue-700' },
  COMPLETED: { label: '已完成', className: 'bg-emerald-100 text-emerald-700' },
  REVIEWED: { label: '已复查', className: 'bg-purple-100 text-purple-700' },
}

const volunteerStatusConfig: Record<string, { label: string; className: string }> = {
  PENDING: { label: '招募中', className: 'bg-amber-100 text-amber-700' },
  CONFIRMED: { label: '已确认', className: 'bg-blue-100 text-blue-700' },
  COMPLETED: { label: '已完成', className: 'bg-emerald-100 text-emerald-700' },
  CANCELLED: { label: '已取消', className: 'bg-slate-100 text-slate-600' },
}

export function Badge({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cn(
      'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
      className
    )}>
      {children}
    </span>
  )
}

export function TopicStatusBadge({ status }: { status: string }) {
  const cfg = topicStatusConfig[status] || topicStatusConfig.DRAFT
  return <Badge className={cfg.className}>{cfg.label}</Badge>
}

export function FacilityStatusBadge({ status }: { status: string }) {
  const cfg = facilityStatusConfig[status] || facilityStatusConfig.NORMAL
  return <Badge className={cfg.className}>{cfg.label}</Badge>
}

export function DamageStatusBadge({ status }: { status: string }) {
  const cfg = damageStatusConfig[status] || damageStatusConfig.PENDING
  return <Badge className={cfg.className}>{cfg.label}</Badge>
}

export function VolunteerStatusBadge({ status }: { status: string }) {
  const cfg = volunteerStatusConfig[status] || volunteerStatusConfig.PENDING
  return <Badge className={cfg.className}>{cfg.label}</Badge>
}

export function RoleBadge({ role }: { role: string }) {
  const configs: Record<string, { label: string; className: string }> = {
    RESIDENT: { label: '居民', className: 'bg-slate-100 text-slate-700' },
    REPRESENTATIVE: { label: '居民代表', className: 'bg-blue-100 text-blue-700' },
    ADMIN: { label: '管理员', className: 'bg-rose-100 text-rose-700' },
    AUDITOR: { label: '审计员', className: 'bg-purple-100 text-purple-700' },
  }
  const cfg = configs[role] || configs.RESIDENT
  return <Badge className={cfg.className}>{cfg.label}</Badge>
}
