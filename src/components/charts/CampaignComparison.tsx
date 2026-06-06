import { useMemo } from 'react'
import ReactECharts from 'echarts-for-react'
import { useDataStore } from '@/store/useDataStore'
import { useFilterStore } from '@/store/useFilterStore'
import ChartCard from '../common/ChartCard'
import EmptyState from '../common/EmptyState'
import { ChartSkeleton } from '../common/LoadingSkeleton'
import { formatCurrency, formatPercentSigned, getTrendColor } from '@/utils/formatters'
import { CAMPAIGNS } from '@/data/mock/seedData'
import { TrendingUp, Tag } from 'lucide-react'

export default function CampaignComparison() {
  const campaignComparison = useDataStore(state => state.campaignComparison)
  const campaignId = useFilterStore(state => state.campaignId)
  const isLoading = useDataStore(state => state.isLoading)
  const isEmpty = useDataStore(state => state.isEmpty)
  
  const campaign = campaignId ? CAMPAIGNS.find(c => c.id === campaignId) : null
  
  const option = useMemo(() => {
    if (campaignComparison.length === 0) return {}
    
    const periods = ['活动前14天', '活动期间', '活动后7天']
    
    return {
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(45, 32, 21, 0.95)',
        borderColor: 'transparent',
        textStyle: { color: '#fff', fontSize: 12 },
        axisPointer: { type: 'shadow' },
      },
      legend: {
        data: ['总销售额', '日均销售额'],
        bottom: 0,
        textStyle: { color: '#8B6A3F', fontSize: 11 },
      },
      grid: {
        left: 60,
        right: 30,
        top: 30,
        bottom: 50,
      },
      xAxis: {
        type: 'category',
        data: periods,
        axisLine: { lineStyle: { color: '#E8DCC8' } },
        axisLabel: { color: '#8B6A3F', fontSize: 11 },
        axisTick: { show: false },
      },
      yAxis: [
        {
          type: 'value',
          name: '总销售额',
          splitLine: { lineStyle: { color: '#F5EFE6', type: 'dashed' } },
          axisLine: { show: false },
          axisTick: { show: false },
          axisLabel: {
            color: '#8B6A3F',
            fontSize: 10,
            formatter: (v: number) => `${(v / 10000).toFixed(0)}万`,
          },
        },
        {
          type: 'value',
          name: '日均',
          splitLine: { show: false },
          axisLine: { show: false },
          axisTick: { show: false },
          axisLabel: {
            color: '#8B6A3F',
            fontSize: 10,
            formatter: (v: number) => `${(v / 1000).toFixed(0)}k`,
          },
        },
      ],
      series: [
        {
          name: '总销售额',
          type: 'bar',
          data: campaignComparison.map(c => c.totalSales),
          barWidth: '40%',
          itemStyle: {
            color: ({ dataIndex }: any) => 
              dataIndex === 1 ? '#F9A825' : '#6F4E37',
            borderRadius: [4, 4, 0, 0],
          },
          markLine: {
            silent: true,
            data: [
              {
                yAxis: campaignComparison[0]?.totalSales,
                lineStyle: { color: '#6F4E37', type: 'dashed' },
                label: { formatter: '活动前基准', color: '#8B6A3F', fontSize: 10 },
              },
            ],
          },
        },
        {
          name: '日均销售额',
          type: 'line',
          yAxisIndex: 1,
          data: campaignComparison.map(c => c.avgDailySales),
          smooth: true,
          symbol: 'circle',
          symbolSize: 8,
          lineStyle: { color: '#2E7D32', width: 2 },
          itemStyle: { 
            color: ({ dataIndex }: any) => dataIndex === 1 ? '#F9A825' : '#2E7D32',
            borderWidth: 2, 
            borderColor: '#fff' 
          },
        },
      ],
    }
  }, [campaignComparison])

  if (!campaignId) {
    return (
      <ChartCard title="活动效果对比" subtitle="选择活动批次查看前后效果对比">
        <div className="flex flex-col items-center justify-center py-12 text-coffee-400">
          <Tag size={40} className="mb-3 opacity-40" />
          <p className="text-sm">请在筛选器中选择一个活动批次</p>
          <p className="text-xs mt-1">系统将自动展示活动前/中/后三期对比</p>
        </div>
      </ChartCard>
    )
  }

  return (
    <ChartCard
      title="活动效果对比"
      subtitle={campaign ? `${campaign.name} (${campaign.startDate} ~ ${campaign.endDate})` : ''}
      sampleSize={campaignComparison.reduce((sum, c) => sum + c.totalOrders, 0)}
    >
      {isLoading ? (
        <ChartSkeleton height={260} />
      ) : isEmpty || campaignComparison.length === 0 ? (
        <EmptyState title="暂无活动数据" />
      ) : (
        <>
          <div className="grid grid-cols-3 gap-4 mb-4">
            {campaignComparison.map((period, idx) => (
              <div key={idx} className={`p-3 rounded-xl ${
                idx === 1 ? 'bg-amber-50 border border-amber-200' : 'bg-coffee-50'
              }`}>
                <div className="text-xs text-coffee-500 mb-1">
                  {idx === 0 ? '活动前' : idx === 1 ? '🔥 活动中' : '活动后'}
                </div>
                <div className="text-lg font-bold text-coffee-800 font-serif">
                  {formatCurrency(period.totalSales)}
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-coffee-500">
                    日均 {formatCurrency(period.avgDailySales)}
                  </span>
                  {idx > 0 && (
                    <span className={`text-xs font-medium flex items-center gap-0.5 ${getTrendColor(period.salesLift)}`}>
                      <TrendingUp size={10} />
                      {formatPercentSigned(period.salesLift)}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          <ReactECharts
            option={option}
            style={{ height: 220 }}
            opts={{ renderer: 'canvas' }}
          />
        </>
      )}
    </ChartCard>
  )
}
