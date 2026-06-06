import { Search, RotateCcw } from 'lucide-react'

interface EmptyStateProps {
  title?: string
  description?: string
  onReset?: () => void
  icon?: React.ReactNode
}

export default function EmptyState({
  title = '暂无数据',
  description = '当前筛选条件下没有可用数据，请尝试调整筛选条件',
  onReset,
  icon,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-20 h-20 rounded-full bg-coffee-50 flex items-center justify-center mb-4">
        {icon || <Search size={32} className="text-coffee-300" />}
      </div>
      
      <h3 className="text-lg font-semibold text-coffee-700 mb-2 font-serif">{title}</h3>
      <p className="text-sm text-coffee-400 mb-6 max-w-sm">{description}</p>
      
      {onReset && (
        <button
          onClick={onReset}
          className="flex items-center gap-2 px-4 py-2 bg-coffee-700 text-white rounded-lg hover:bg-coffee-800 transition-colors text-sm"
        >
          <RotateCcw size={14} />
          重置筛选条件
        </button>
      )}
    </div>
  )
}
