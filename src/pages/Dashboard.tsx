import { useMemo } from 'react'
import { useFilterStore } from '@/store/filterStore'
import { computeKPI, computePareto, computeProductionLineComparison, computeRepairDuration, computeSparePartCorrelation } from '@/utils/dataAggregator'
import KPICards from '@/components/KPICards'
import DowntimeModeToggle from '@/components/DowntimeModeToggle'
import ParetoChart from '@/components/ParetoChart'
import ProductionLineChart from '@/components/ProductionLineChart'
import RepairDurationChart from '@/components/RepairDurationChart'
import SparePartCorrelationChart from '@/components/SparePartCorrelationChart'

export default function Dashboard() {
  const equipmentIds = useFilterStore(s => s.equipmentIds)
  const productionLines = useFilterStore(s => s.productionLines)
  const shifts = useFilterStore(s => s.shifts)
  const faultTypes = useFilterStore(s => s.faultTypes)
  const maintenancePersonIds = useFilterStore(s => s.maintenancePersonIds)
  const downtimeMode = useFilterStore(s => s.downtimeMode)
  const dateRange = useFilterStore(s => s.dateRange)

  const filter = useMemo(() => ({
    equipmentIds,
    productionLines,
    shifts,
    faultTypes,
    maintenancePersonIds,
    downtimeMode,
    dateRange,
  }), [equipmentIds, productionLines, shifts, faultTypes, maintenancePersonIds, downtimeMode, dateRange])

  const kpiData = useMemo(() => computeKPI(filter), [filter])
  const paretoData = useMemo(() => computePareto(filter), [filter])
  const productionLineData = useMemo(() => computeProductionLineComparison(filter), [filter])
  const repairDurationData = useMemo(() => computeRepairDuration(filter), [filter])
  const sparePartData = useMemo(() => computeSparePartCorrelation(filter), [filter])

  return (
    <div className="bg-[#0A1628] min-h-screen p-6">
      <DowntimeModeToggle />
      <div className="mt-4">
        <KPICards data={kpiData} />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-4">
        <div className="h-[400px]">
          <ParetoChart data={paretoData} />
        </div>
        <div className="h-[400px]">
          <ProductionLineChart data={productionLineData} />
        </div>
        <div className="h-[500px]">
          <RepairDurationChart data={repairDurationData} />
        </div>
        <div className="h-[500px]">
          <SparePartCorrelationChart data={sparePartData} />
        </div>
      </div>
    </div>
  )
}
