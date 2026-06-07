import type { ReactNode } from 'react'
import { Bike } from 'lucide-react'
import { useFilterStore } from '@/store/filterStore'

interface EmptyStateProps {
  title: string
  description?: string
  icon?: ReactNode
}

export default function EmptyState({ title, description, icon }: EmptyStateProps) {
  const resetFilters = useFilterStore((s) => s.resetFilters)

  return (
    <div className="flex flex-col items-center justify-center py-16 bg-[#1a1d23]">
      <div className="flex items-center justify-center w-24 h-24 rounded-full border-2 border-dashed border-[#2a2d35] mb-6">
        {icon ?? <Bike className="w-10 h-10 text-gray-500" />}
      </div>
      <h3 className="text-lg font-medium text-gray-400 mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-gray-500 mb-6 max-w-xs text-center">{description}</p>
      )}
      <button
        onClick={resetFilters}
        className="px-4 py-2 rounded-lg bg-[#00e5c7]/10 text-[#00e5c7] text-sm hover:bg-[#00e5c7]/20 transition-colors"
      >
        重置筛选
      </button>
    </div>
  )
}
