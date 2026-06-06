import { Calendar } from 'lucide-react'
import { useFilterStore } from '@/store/useFilterStore'
import type { TimeWindow } from '@/types/data'

const TIME_WINDOWS: { value: TimeWindow; label: string }[] = [
  { value: 'day', label: '日' },
  { value: 'week', label: '周' },
  { value: 'month', label: '月' },
]

const QUICK_RANGES = [
  { label: '近7天', days: 7 },
  { label: '近14天', days: 14 },
  { label: '近30天', days: 30 },
  { label: '近90天', days: 90 },
]

export default function TimeRangeFilter() {
  const timeRange = useFilterStore(state => state.timeRange)
  const timeWindow = useFilterStore(state => state.timeWindow)
  const setTimeRange = useFilterStore(state => state.setTimeRange)
  const setTimeWindow = useFilterStore(state => state.setTimeWindow)
  
  const handleQuickRange = (days: number) => {
    const end = new Date('2025-07-15')
    const start = new Date(end)
    start.setDate(start.getDate() - days + 1)
    
    setTimeRange(
      start.toISOString().split('T')[0],
      end.toISOString().split('T')[0]
    )
  }

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-coffee-200 bg-white">
        <Calendar size={16} className="text-coffee-500" />
        <input
          type="date"
          value={timeRange.start}
          onChange={(e) => setTimeRange(e.target.value, timeRange.end)}
          className="text-sm text-coffee-700 bg-transparent outline-none w-28"
        />
        <span className="text-coffee-300">~</span>
        <input
          type="date"
          value={timeRange.end}
          onChange={(e) => setTimeRange(timeRange.start, e.target.value)}
          className="text-sm text-coffee-700 bg-transparent outline-none w-28"
        />
      </div>
      
      <div className="flex items-center gap-1 bg-coffee-50 rounded-lg p-1">
        {QUICK_RANGES.map(range => (
          <button
            key={range.days}
            onClick={() => handleQuickRange(range.days)}
            className="px-2.5 py-1 text-xs rounded-md text-coffee-600 hover:bg-white hover:shadow-sm transition-all"
          >
            {range.label}
          </button>
        ))}
      </div>
      
      <div className="flex items-center gap-1 bg-coffee-100 rounded-lg p-1">
        {TIME_WINDOWS.map(tw => (
          <button
            key={tw.value}
            onClick={() => setTimeWindow(tw.value)}
            className={`px-3 py-1 text-sm rounded-md transition-all ${
              timeWindow === tw.value 
                ? 'bg-white text-coffee-700 shadow-sm font-medium' 
                : 'text-coffee-500 hover:text-coffee-700'
            }`}
          >
            {tw.label}
          </button>
        ))}
      </div>
    </div>
  )
}
