import { useEffect } from 'react'
import DashboardHeader from '@/components/layout/DashboardHeader'
import KPICard from '@/components/common/KPICard'
import ChartCard from '@/components/common/ChartCard'
import EmptyState from '@/components/common/EmptyState'
import DetailDrawer from '@/components/common/DetailDrawer'
import SalesTrendChart from '@/components/charts/SalesTrendChart'
import StoreHeatmap from '@/components/charts/StoreHeatmap'
import StoreRanking from '@/components/charts/StoreRanking'
import WeatherImpactChart from '@/components/charts/WeatherImpactChart'
import HourlyHeatmap from '@/components/charts/HourlyHeatmap'
import CampaignComparison from '@/components/charts/CampaignComparison'
import { useDataStore } from '@/store/useDataStore'
import { useFilterSync, useInitializeData } from '@/hooks/useFilterSync'
import { useFilterStore } from '@/store/useFilterStore'
import { AlertTriangle, RotateCcw } from 'lucide-react'

export default function Dashboard() {
  useInitializeData()
  useFilterSync()
  
  const kpiData = useDataStore(state => state.kpiData)
  const isEmpty = useDataStore(state => state.isEmpty)
  const isLoading = useDataStore(state => state.isLoading)
  const anomalies = useDataStore(state => state.anomalies)
  const drillDownContext = useDataStore(state => state.drillDownContext)
  const clearDrillDown = useDataStore(state => state.clearDrillDown)
  const getDetailData = useDataStore(state => state.getDetailData)
  const resetFilters = useFilterStore(state => state.resetFilters)
  
  const detailData = getDetailData()
  
  const filterSummary = () => {
    const filters = useFilterStore.getState()
    const parts: string[] = []
    parts.push(`${filters.timeRange.start} ~ ${filters.timeRange.end}`)
    if (filters.storeIds.length > 0) parts.push(`${filters.storeIds.length}家门店`)
    if (filters.weatherTypes.length > 0) parts.push(`${filters.weatherTypes.length}种天气`)
    if (filters.campaignId) parts.push('指定活动')
    return parts.join(' · ')
  }
  
  const criticalAnomalies = anomalies.filter(a => a.severity === 'critical')
  const warningAnomalies = anomalies.filter(a => a.severity === 'warning')

  return (
    <div className="min-h-screen bg-cream-100">
      <DashboardHeader />
      
      <main className="p-6" id="dashboard-content">
        {anomalies.length > 0 && (
          <div className={`mb-5 p-4 rounded-xl border ${
            criticalAnomalies.length > 0 
              ? 'bg-red-50 border-red-200' 
              : 'bg-amber-50 border-amber-200'
          } animate-fade-in-up opacity-0`}>
            <div className="flex items-start gap-3">
              <AlertTriangle className={criticalAnomalies.length > 0 ? 'text-red-500' : 'text-amber-500'} size={20} />
              <div className="flex-1">
                <h4 className={`font-medium ${criticalAnomalies.length > 0 ? 'text-red-700' : 'text-amber-700'}`}>
                  检测到 {anomalies.length} 个异常点需要关注
                </h4>
                <p className={`text-sm mt-1 ${criticalAnomalies.length > 0 ? 'text-red-600' : 'text-amber-600'}`}>
                  {criticalAnomalies.length > 0 && `${criticalAnomalies.length} 个严重异常，`}
                  {warningAnomalies.length > 0 && `${warningAnomalies.length} 个警告异常`}
                </p>
              </div>
            </div>
          </div>
        )}
        
        {isEmpty && !isLoading ? (
          <div className="py-20">
            <EmptyState
              title="当前筛选条件无数据"
              description="请尝试调整时间范围、门店或其他筛选条件查看数据"
              onReset={resetFilters}
              icon={<RotateCcw size={32} className="text-coffee-300" />}
            />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <KPICard
                title="总销售额"
                value={kpiData?.totalSales || 0}
                trend={kpiData?.salesWoW || 0}
                subtitle={`样本量: ${kpiData?.sampleSize || 0} 条`}
                format="currency"
                delay={50}
              />
              <KPICard
                title="客单价"
                value={kpiData?.avgOrderValue || 0}
                trend={kpiData?.aovWoW || 0}
                subtitle="平均每单消费金额"
                format="number"
                delay={100}
              />
              <KPICard
                title="总订单数"
                value={kpiData?.totalOrders || 0}
                trend={kpiData?.ordersWoW || 0}
                subtitle="期间累计订单量"
                format="number"
                delay={150}
              />
              <KPICard
                title="库存损耗率"
                value={kpiData?.inventoryLossRate || 0}
                trend={kpiData?.lossRateWoW || 0}
                subtitle={`券核销率: ${((kpiData?.couponRedemptionRate || 0) * 100).toFixed(1)}%`}
                format="percent"
                delay={200}
              />
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
              <div className="lg:col-span-2">
                <SalesTrendChart />
              </div>
              <div>
                <WeatherImpactChart />
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
              <div className="lg:col-span-2">
                <StoreHeatmap />
              </div>
              <div>
                <HourlyHeatmap />
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              <div className="lg:col-span-2">
                <StoreRanking />
              </div>
              <div>
                <CampaignComparison />
              </div>
            </div>
          </>
        )}
      </main>
      
      <DetailDrawer
        isOpen={!!drillDownContext.type}
        onClose={clearDrillDown}
        title={drillDownContext.title || '明细数据'}
        subtitle={drillDownContext.type ? `下钻维度: ${drillDownContext.type}` : ''}
        filterSummary={filterSummary()}
        data={detailData}
      />
    </div>
  )
}
