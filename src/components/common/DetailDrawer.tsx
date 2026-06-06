import { X, Download, Filter } from 'lucide-react'
import { DailySalesData } from '@/types/data'
import { formatCurrency, formatDateFull } from '@/utils/formatters'
import * as XLSX from 'xlsx'

interface DetailDrawerProps {
  isOpen: boolean
  onClose: () => void
  title: string
  subtitle?: string
  data: DailySalesData[]
  filterSummary?: string
}

export default function DetailDrawer({
  isOpen,
  onClose,
  title,
  subtitle,
  data,
  filterSummary,
}: DetailDrawerProps) {
  const handleExportExcel = () => {
    const exportData = data.map(item => ({
      '日期': item.date,
      '门店': item.storeName,
      '销售额': item.salesAmount,
      '订单数': item.orderCount,
      '客单价': item.avgOrderValue,
      '库存损耗': item.inventoryLoss,
      '损耗率': `${(item.inventoryLossRate * 100).toFixed(2)}%`,
      '天气': item.weatherType,
      '温度': item.temperature,
      '节假日': item.isHoliday ? item.holidayName || '是' : '否',
    }))
    
    const ws = XLSX.utils.json_to_sheet(exportData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, '明细数据')
    XLSX.writeFile(wb, `明细数据_${new Date().toISOString().split('T')[0]}.xlsx`)
  }

  if (!isOpen) return null

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/30 z-40 transition-opacity"
        onClick={onClose}
      />
      
      <div className="fixed right-0 top-0 h-full w-full max-w-2xl bg-white z-50 shadow-2xl flex flex-col animate-slide-in">
        <div className="p-5 border-b border-coffee-100 flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold text-coffee-800 font-serif">{title}</h2>
            {subtitle && <p className="text-sm text-coffee-500 mt-1">{subtitle}</p>}
            {filterSummary && (
              <div className="flex items-center gap-1.5 mt-2 text-xs text-coffee-500">
                <Filter size={12} />
                <span>{filterSummary}</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportExcel}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-coffee-700 text-white rounded-lg hover:bg-coffee-800 transition-colors"
            >
              <Download size={14} />
              导出Excel
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-coffee-400 hover:text-coffee-600 rounded-lg hover:bg-coffee-50 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>
        
        <div className="flex-1 overflow-auto">
          {data.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-coffee-400">
              <p className="text-sm">暂无明细数据</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-coffee-50 sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-coffee-600">日期</th>
                  <th className="px-4 py-3 text-left font-medium text-coffee-600">门店</th>
                  <th className="px-4 py-3 text-right font-medium text-coffee-600">销售额</th>
                  <th className="px-4 py-3 text-right font-medium text-coffee-600">订单数</th>
                  <th className="px-4 py-3 text-right font-medium text-coffee-600">客单价</th>
                  <th className="px-4 py-3 text-right font-medium text-coffee-600">损耗率</th>
                  <th className="px-4 py-3 text-center font-medium text-coffee-600">天气</th>
                </tr>
              </thead>
              <tbody>
                {data.map((item, idx) => (
                  <tr key={idx} className="border-b border-coffee-50 hover:bg-coffee-50/50">
                    <td className="px-4 py-3 text-coffee-700">{formatDateFull(item.date)}</td>
                    <td className="px-4 py-3 text-coffee-700 font-medium">{item.storeName}</td>
                    <td className="px-4 py-3 text-right text-coffee-800 font-medium">{formatCurrency(item.salesAmount)}</td>
                    <td className="px-4 py-3 text-right text-coffee-600">{item.orderCount}</td>
                    <td className="px-4 py-3 text-right text-coffee-600">¥{item.avgOrderValue}</td>
                    <td className="px-4 py-3 text-right text-coffee-600">{(item.inventoryLossRate * 100).toFixed(2)}%</td>
                    <td className="px-4 py-3 text-center">
                      <WeatherBadge type={item.weatherType} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        
        <div className="p-4 border-t border-coffee-100 bg-coffee-50/50">
          <div className="flex justify-between items-center text-sm text-coffee-500">
            <span>共 {data.length} 条记录</span>
            <span>数据更新时间: {new Date().toLocaleString('zh-CN')}</span>
          </div>
        </div>
      </div>
      
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .animate-slide-in {
          animation: slideIn 0.25s ease-out forwards;
        }
      `}</style>
    </>
  )
}

function WeatherBadge({ type }: { type: string }) {
  const weatherMap: Record<string, { icon: string; bg: string }> = {
    sunny: { icon: '☀️', bg: 'bg-yellow-50 text-yellow-700' },
    cloudy: { icon: '⛅', bg: 'bg-gray-50 text-gray-600' },
    rainy: { icon: '🌧️', bg: 'bg-blue-50 text-blue-600' },
    stormy: { icon: '⛈️', bg: 'bg-purple-50 text-purple-600' },
    snowy: { icon: '❄️', bg: 'bg-cyan-50 text-cyan-600' },
    hot: { icon: '🔥', bg: 'bg-orange-50 text-orange-600' },
    cold: { icon: '🥶', bg: 'bg-sky-50 text-sky-600' },
  }
  
  const w = weatherMap[type] || { icon: '🌤️', bg: 'bg-gray-50 text-gray-600' }
  
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${w.bg}`}>
      {w.icon}
    </span>
  )
}
