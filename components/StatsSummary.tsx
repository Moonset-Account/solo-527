'use client'

import { TrendingUp, Truck, AlertTriangle, Clock, Users } from 'lucide-react'
import { formatPercent } from '@/lib/utils/common'
import { formatDuration } from '@/lib/utils/business'
import type { StationAggregate } from '@/lib/types'
import { isLowSample } from '@/lib/utils/business'

interface StatsSummaryProps {
  stations: StationAggregate[]
  permission: { canViewDetails: boolean }
}

export default function StatsSummary({ stations, permission }: StatsSummaryProps) {
  const activeStations = stations.filter(s => s.totalWaybills > 0)
  const totalWaybills = activeStations.reduce((sum, s) => sum + s.totalWaybills, 0)
  const totalDelayed = activeStations.reduce((sum, s) => sum + s.delayedWaybills, 0)
  const avgDuration = activeStations.length > 0
    ? activeStations.reduce((sum, s) => sum + s.averageDurationMinutes * s.totalWaybills, 0) / totalWaybills
    : 0
  const delayRate = totalWaybills > 0 ? totalDelayed / totalWaybills : 0

  const showLowSample = isLowSample(totalWaybills) && !permission.canViewDetails

  const stats = [
    {
      icon: <Truck className="w-6 h-6 text-blue-500" />,
      label: '覆盖站点',
      value: activeStations.length.toString(),
      sub: '个中转站',
    },
    {
      icon: <TrendingUp className="w-6 h-6 text-green-500" />,
      label: '运单总数',
      value: showLowSample ? '样本不足' : totalWaybills.toString(),
      sub: showLowSample ? '' : '单',
    },
    {
      icon: <AlertTriangle className="w-6 h-6 text-red-500" />,
      label: '迟滞运单',
      value: showLowSample ? '样本不足' : totalDelayed.toString(),
      sub: showLowSample ? '' : `占比 ${formatPercent(delayRate)}`,
    },
    {
      icon: <Clock className="w-6 h-6 text-orange-500" />,
      label: '平均停留',
      value: showLowSample ? '样本不足' : formatDuration(Math.round(avgDuration)),
      sub: showLowSample ? '' : '每单',
    },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((stat, idx) => (
        <div key={idx} className="card">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-50 rounded-lg">
              {stat.icon}
            </div>
            <div>
              <div className="text-xs text-gray-500">{stat.label}</div>
              <div className="text-xl font-bold text-gray-800">{stat.value}</div>
              {stat.sub && <div className="text-xs text-gray-400">{stat.sub}</div>}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
