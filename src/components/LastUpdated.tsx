import { getLastUpdateTime } from '@/api/cache'
import { RefreshCw } from 'lucide-react'

export default function LastUpdated() {
  const time = getLastUpdateTime()

  return (
    <div className="flex items-center gap-1.5 text-xs text-base-400">
      <RefreshCw className="w-3 h-3" />
      <span>数据更新于 {time}</span>
    </div>
  )
}
