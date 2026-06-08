import { ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PanelProps {
  title: string
  titleExtra?: React.ReactNode
  children: React.ReactNode
  collapsed?: boolean
  onToggleCollapse?: () => void
  className?: string
}

export default function Panel({
  title,
  titleExtra,
  children,
  collapsed = false,
  onToggleCollapse,
  className,
}: PanelProps) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-xl border border-white/10 bg-black/60 backdrop-blur-md',
        className,
      )}
    >
      <div
        className="flex cursor-pointer items-center justify-between px-4 py-3"
        onClick={onToggleCollapse}
      >
        <div className="flex items-center gap-1.5">
          <h3 className="text-sm font-semibold text-white/90">{title}</h3>
          {titleExtra}
        </div>
        {collapsed ? (
          <ChevronDown className="h-4 w-4 text-white/50" />
        ) : (
          <ChevronUp className="h-4 w-4 text-white/50" />
        )}
      </div>
      {!collapsed && <div className="px-4 pb-4">{children}</div>}
    </div>
  )
}
