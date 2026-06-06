import { Coffee } from 'lucide-react'
import StoreFilter from '../filters/StoreFilter'
import WeatherFilter from '../filters/WeatherFilter'
import CampaignFilter from '../filters/CampaignFilter'
import TimeRangeFilter from '../filters/TimeRangeFilter'
import ViewToolbar from './ViewToolbar'

export default function DashboardHeader() {
  return (
    <header className="bg-white border-b border-coffee-100 shadow-sm">
      <div className="px-6 py-4 border-b border-coffee-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-coffee-700 flex items-center justify-center text-white">
              <Coffee size={22} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-coffee-800 font-serif">
                连锁咖啡店销售与天气影响看板
              </h1>
              <p className="text-xs text-coffee-500 mt-0.5">
                实时监控门店业绩 · 智能分析天气影响 · 精准评估促销效果
              </p>
            </div>
          </div>
          
          <ViewToolbar />
        </div>
      </div>
      
      <div className="px-6 py-3 bg-coffee-50/50">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            <StoreFilter />
            <WeatherFilter />
            <CampaignFilter />
          </div>
          
          <TimeRangeFilter />
        </div>
      </div>
    </header>
  )
}
