import { useEffect } from 'react'
import { useDashboardStore } from '@/store/dashboardStore'
import { useFilterStore } from '@/store/filterStore'
import MetricCard from '@/components/MetricCard'
import ReasonTreemap from '@/components/ReasonTreemap'
import CycleDistribution from '@/components/CycleDistribution'
import ProductRanking from '@/components/ProductRanking'
import CSDurationChart from '@/components/CSDurationChart'
import GeoHeatmap from '@/components/GeoHeatmap'

export default function Dashboard() {
  const { overview, fetchOverview, fetchReasonTree, fetchCycleDistribution, fetchProductRanking, fetchCSDuration, fetchGeoHeatmap, fetchSamples } = useDashboardStore()
  const dataUpdateTime = useFilterStore((s) => s.dataUpdateTime)

  useEffect(() => {
    fetchOverview()
    fetchReasonTree()
    fetchCycleDistribution()
    fetchProductRanking()
    fetchCSDuration()
    fetchGeoHeatmap()
    fetchSamples()
  }, [])

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-5 gap-4">
        <MetricCard
          value={overview?.totalReturns?.toLocaleString() ?? '-'}
          label="退货总量"
          trend="down"
          trendValue="-2.3%"
          subValue="较上周期"
        />
        <MetricCard
          value={overview?.avgRefundCycle ?? '-'}
          label="平均退款周期(天)"
          trend="down"
          trendValue="-0.5天"
          subValue="较上周期"
        />
        <MetricCard
          value={overview?.returnRate != null ? `${overview.returnRate}%` : '-'}
          label="退货率"
          trend="up"
          trendValue="+0.8%"
          subValue="较上周期"
        />
        <MetricCard
          value={overview?.anomalyRate != null ? `${overview.anomalyRate}%` : '-'}
          label="异常率"
          trend="up"
          trendValue="+1.2%"
          subValue="较上周期"
          anomaly
        />
        <MetricCard
          value={overview?.sampleSize?.toLocaleString() ?? '-'}
          label="样本量"
          subValue={`截至 ${dataUpdateTime.slice(0, 10)}`}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <ReasonTreemap />
        <CycleDistribution />
        <ProductRanking />
        <CSDurationChart />
      </div>

      <div className="w-full">
        <GeoHeatmap height={320} />
      </div>

      <footer className="text-center text-xs text-slate-400 py-3">
        数据更新时间: {dataUpdateTime.slice(0, 19).replace('T', ' ')}
      </footer>
    </div>
  )
}
