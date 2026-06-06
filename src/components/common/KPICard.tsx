import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react'
import { formatCurrency, formatPercentSigned, getTrendColor } from '@/utils/formatters'

interface KPICardProps {
  title: string
  value: number
  trend?: number
  subtitle?: string
  format?: 'currency' | 'number' | 'percent'
  delay?: number
}

export default function KPICard({ 
  title, 
  value, 
  trend = 0, 
  subtitle, 
  format = 'currency',
  delay = 0 
}: KPICardProps) {
  const displayValue = format === 'currency' 
    ? formatCurrency(value) 
    : format === 'percent' 
    ? `${(value * 100).toFixed(2)}%`
    : value.toLocaleString()
  
  const trendColor = getTrendColor(trend)
  const animationDelay = `${delay}ms`

  return (
    <div 
      className="bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-300 border border-coffee-100 animate-fade-in-up opacity-0"
      style={{ animationDelay }}
    >
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-sm font-medium text-coffee-600">{title}</h3>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 text-xs font-medium ${trendColor}`}>
            {trend > 0 ? (
              <ArrowUpRight size={14} />
            ) : trend < 0 ? (
              <ArrowDownRight size={14} />
            ) : (
              <Minus size={14} />
            )}
            <span>{formatPercentSigned(trend)}</span>
          </div>
        )}
      </div>
      
      <div className="text-2xl font-bold text-coffee-800 font-serif mb-1">
        {displayValue}
      </div>
      
      {subtitle && (
        <div className="text-xs text-coffee-400">{subtitle}</div>
      )}
    </div>
  )
}
