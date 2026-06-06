import { ReactNode, useState } from 'react'
import { ChevronDown, ChevronUp, RefreshCw, Info } from 'lucide-react'

interface ChartCardProps {
  title: string
  subtitle?: string
  children: ReactNode
  actions?: ReactNode
  sampleSize?: number
  isLoading?: boolean
  onRefresh?: () => void
  collapsible?: boolean
  defaultCollapsed?: boolean
}

export default function ChartCard({
  title,
  subtitle,
  children,
  actions,
  sampleSize,
  isLoading,
  onRefresh,
  collapsible = false,
  defaultCollapsed = false,
}: ChartCardProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed)
  
  const lowSampleSize = sampleSize !== undefined && sampleSize < 30

  return (
    <div className="bg-white rounded-xl shadow-sm border border-coffee-100 overflow-hidden">
      <div className="px-5 py-4 border-b border-coffee-50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {collapsible && (
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="text-coffee-400 hover:text-coffee-600 transition-colors"
            >
              {collapsed ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
            </button>
          )}
          <div>
            <h3 className="font-semibold text-coffee-800">{title}</h3>
            {subtitle && <p className="text-xs text-coffee-400 mt-0.5">{subtitle}</p>}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {sampleSize !== undefined && (
            <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
              lowSampleSize ? 'bg-yellow-50 text-yellow-700' : 'bg-coffee-50 text-coffee-600'
            }`}>
              <Info size={12} />
              <span>样本量: {sampleSize}</span>
            </div>
          )}
          
          {actions}
          
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="p-1.5 text-coffee-400 hover:text-coffee-600 transition-colors rounded-lg hover:bg-coffee-50"
            >
              <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
            </button>
          )}
        </div>
      </div>
      
      {!collapsed && (
        <div className="p-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-pulse-slow text-coffee-400 text-sm">数据加载中...</div>
            </div>
          ) : (
            children
          )}
        </div>
      )}
    </div>
  )
}
