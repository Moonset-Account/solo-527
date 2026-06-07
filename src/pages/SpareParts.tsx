import FilterBar from '@/components/FilterBar'
import SparePartRanking from '@/components/SparePartRanking'
import SparePartHeatmap from '@/components/SparePartHeatmap'
import SparePartTrend from '@/components/SparePartTrend'
import SparePartTable from '@/components/SparePartTable'
import LastUpdated from '@/components/LastUpdated'
import ExportButton from '@/components/ExportButton'

export default function SpareParts() {
  return (
    <div className="min-h-screen">
      <FilterBar />
      <div className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <LastUpdated />
          <ExportButton />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <SparePartRanking />
          <SparePartHeatmap />
        </div>

        <SparePartTrend />

        <SparePartTable />
      </div>
    </div>
  )
}
