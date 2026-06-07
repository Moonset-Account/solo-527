import FilterBar from '@/components/FilterBar'
import MaintenanceDistribution from '@/components/MaintenanceDistribution'
import MaintenancePersonChart from '@/components/MaintenancePersonChart'
import DrillDownPanel from '@/components/DrillDownPanel'
import ParetoChart from '@/components/ParetoChart'
import LastUpdated from '@/components/LastUpdated'
import ExportButton from '@/components/ExportButton'
import { useFilterStore } from '@/store/filterStore'
import { getFilteredRecords } from '@/api/aggregation'
import { useMemo } from 'react'

export default function Analysis() {
  const filters = useFilterStore()
  const records = useMemo(() => getFilteredRecords(filters), [filters])

  const plannedRecords = useMemo(() => records.filter(r => r.downtimeType === 'planned'), [records])
  const unplannedRecords = useMemo(() => records.filter(r => r.downtimeType === 'unplanned'), [records])

  const plannedTotal = plannedRecords.reduce((s, r) => s + r.duration, 0)
  const unplannedTotal = unplannedRecords.reduce((s, r) => s + r.duration, 0)
  const plannedAvg = plannedRecords.length > 0 ? plannedRecords.reduce((s, r) => s + r.maintenanceDuration, 0) / plannedRecords.length : 0
  const unplannedAvg = unplannedRecords.length > 0 ? unplannedRecords.reduce((s, r) => s + r.maintenanceDuration, 0) / unplannedRecords.length : 0

  return (
    <div className="min-h-screen">
      <FilterBar />
      <div className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <LastUpdated />
          <ExportButton />
        </div>

        <div className="grid grid-cols-4 gap-3">
          <div className="bg-base-800 rounded-lg border border-planned/20 p-4">
            <div className="text-xs text-base-400 mb-1">计划检修总时长</div>
            <div className="text-2xl font-mono font-bold text-planned">{plannedTotal.toLocaleString()}</div>
            <div className="text-xs text-base-400 mt-1">分钟 · {plannedRecords.length} 次</div>
          </div>
          <div className="bg-base-800 rounded-lg border border-unplanned/20 p-4">
            <div className="text-xs text-base-400 mb-1">突发停机总时长</div>
            <div className="text-2xl font-mono font-bold text-unplanned">{unplannedTotal.toLocaleString()}</div>
            <div className="text-xs text-base-400 mt-1">分钟 · {unplannedRecords.length} 次</div>
          </div>
          <div className="bg-base-800 rounded-lg border border-planned/20 p-4">
            <div className="text-xs text-base-400 mb-1">计划检修平均时长</div>
            <div className="text-2xl font-mono font-bold text-planned">{plannedAvg.toFixed(1)}</div>
            <div className="text-xs text-base-400 mt-1">分钟/次</div>
          </div>
          <div className="bg-base-800 rounded-lg border border-unplanned/20 p-4">
            <div className="text-xs text-base-400 mb-1">突发停机平均时长</div>
            <div className="text-2xl font-mono font-bold text-unplanned">{unplannedAvg.toFixed(1)}</div>
            <div className="text-xs text-base-400 mt-1">分钟/次</div>
          </div>
        </div>

        <ParetoChart />

        <div className="grid grid-cols-2 gap-4">
          <MaintenanceDistribution />
          <MaintenancePersonChart />
        </div>

        <DrillDownPanel />
      </div>
    </div>
  )
}
