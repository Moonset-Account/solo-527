import { Lock } from 'lucide-react'

interface ChildDataBadgeProps {
  show?: boolean
}

export default function ChildDataBadge({ show = true }: ChildDataBadgeProps) {
  if (!show) return null
  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 text-blue-600 text-xs font-medium border border-blue-100">
      <Lock className="w-3 h-3" />
      <span>少儿数据已聚合</span>
    </div>
  )
}
