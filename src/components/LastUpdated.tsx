import { getLastUpdateTime, getETLInfo } from '@/api/cache'
import { RefreshCw, Database } from 'lucide-react'

export default function LastUpdated() {
  const time = getLastUpdateTime()
  const etlInfo = getETLInfo()

  return (
    <div className="flex items-center gap-3 text-xs text-base-400">
      <div className="flex items-center gap-1.5">
        <RefreshCw className="w-3 h-3" />
        <span>缓存更新于 {time}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <Database className="w-3 h-3" />
        <span>ETL 完成 {etlInfo.recordCount} 条 · {etlInfo.completedAt.replace('T', ' ').slice(0, 19)}</span>
      </div>
    </div>
  )
}
