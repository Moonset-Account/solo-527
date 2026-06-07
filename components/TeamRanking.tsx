'use client'

import { Users, AlertCircle, Trophy } from 'lucide-react'
import { formatPercent } from '@/lib/utils/common'
import { formatDuration } from '@/lib/utils/business'
import { getDelayCategoryLabel } from '@/lib/utils/business'

interface TeamPerformance {
  teamId: string
  teamName: string
  stationName: string
  totalWaybills: number
  delayedWaybills: number
  delayRate: number
  averageDurationMinutes: number
  isLowSample: boolean
}

interface TeamRankingProps {
  teams: TeamPerformance[]
  canViewDetails: boolean
}

export default function TeamRanking({ teams, canViewDetails }: TeamRankingProps) {
  const validTeams = teams
    .filter(t => canViewDetails || !t.isLowSample)
    .sort((a, b) => a.delayRate - b.delayRate)

  const lowSampleCount = teams.filter(t => t.isLowSample).length

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-500" />
          <h3 className="font-semibold text-gray-800">装卸队效率榜</h3>
        </div>
        {!canViewDetails && (
          <span className="text-xs text-gray-500">仅显示聚合数据</span>
        )}
      </div>

      {lowSampleCount > 0 && canViewDetails && (
        <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-blue-700">
            有 {lowSampleCount} 个装卸队样本量不足，未进入排名。车辆维修造成的迟滞已排除，不归因到装卸队。
          </p>
        </div>
      )}

      <div className="space-y-2 max-h-64 overflow-y-auto">
        {validTeams.length === 0 ? (
          <div className="text-center py-6 text-gray-400 text-sm">
            暂无足够数据
          </div>
        ) : (
          validTeams.map((team, idx) => (
            <div
              key={team.teamId}
              className={`p-3 rounded-lg border ${
                idx === 0 ? 'bg-yellow-50 border-yellow-200' :
                idx === 1 ? 'bg-gray-50 border-gray-200' :
                idx === 2 ? 'bg-orange-50 border-orange-200' :
                'bg-white border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {idx < 3 && (
                    <span className={`w-5 h-5 flex items-center justify-center rounded-full text-xs font-bold text-white ${
                      idx === 0 ? 'bg-yellow-500' :
                      idx === 1 ? 'bg-gray-400' :
                      'bg-orange-400'
                    }`}>
                      {idx + 1}
                    </span>
                  )}
                  <span className="text-sm font-medium text-gray-800">{team.teamName}</span>
                  <span className="text-xs text-gray-500">({team.stationName})</span>
                </div>
                <span className={`text-xs font-medium ${
                  team.delayRate < 0.2 ? 'text-green-600' :
                  team.delayRate < 0.4 ? 'text-yellow-600' :
                  'text-red-600'
                }`}>
                  迟滞率 {formatPercent(team.delayRate)}
                </span>
              </div>
              
              {canViewDetails && (
                <div className="flex gap-4 text-xs text-gray-500">
                  <span>处理 {team.totalWaybills} 单</span>
                  <span>平均 {formatDuration(Math.round(team.averageDurationMinutes))}</span>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <div className="mt-3 pt-3 border-t border-gray-100">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Users className="w-3 h-3" />
          <span>统计规则：车辆维修、天气原因造成的迟滞不归因到装卸队</span>
        </div>
      </div>
    </div>
  )
}
