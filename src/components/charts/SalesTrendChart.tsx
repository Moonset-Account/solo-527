import { useMemo, useState } from 'react'
import ReactECharts from 'echarts-for-react'
import { useDataStore } from '@/store/useDataStore'
import { useFilterStore } from '@/store/useFilterStore'
import { formatCurrency, formatDate } from '@/utils/formatters'
import { CAMPAIGNS } from '@/data/mock/seedData'
import ChartCard from '../common/ChartCard'
import EmptyState from '../common/EmptyState'
import { ChartSkeleton } from '../common/LoadingSkeleton'

type MetricType = 'sales' | 'orders' | 'aov' | 'loss'

const METRICS: { value: MetricType; label: string; unit: string }[] = [
  { value: 'sales', label: '销售额', unit: '元' },
  { value: 'orders', label: '订单数', unit: '单' },
  { value: 'aov', label: '客单价', unit: '元' },
  { value: 'loss', label: '损耗率', unit: '%' },
]

export default function SalesTrendChart() {
  const [metric, setMetric] = useState<MetricType>('sales')
  const timeSeriesData = useDataStore(state => state.timeSeriesData)
  const isLoading = useDataStore(state => state.isLoading)
  const isEmpty = useDataStore(state => state.isEmpty)
  const campaignId = useFilterStore(state => state.campaignId)
  const setDrillDown = useDataStore(state => state.setDrillDown)
  
  const option = useMemo(() => {
    if (timeSeriesData.length === 0) return {}
    
    const dates = timeSeriesData.map(d => formatDate(d.date))
    
    let values: number[]
    switch (metric) {
      case 'sales':
        values = timeSeriesData.map(d => d.salesAmount)
        break
      case 'orders':
        values = timeSeriesData.map(d => d.orderCount)
        break
      case 'aov':
        values = timeSeriesData.map(d => d.avgOrderValue)
        break
      case 'loss':
        values = timeSeriesData.map(d => d.inventoryLossRate * 100)
        break
    }
    
    const markPoints = timeSeriesData
      .filter(d => d.isHoliday || d.campaignId)
      .map((d, idx) => ({
        name: d.isHoliday ? '节假日' : d.campaignId ? '活动' : '',
        xAxis: idx,
        yAxis: values[idx] * 1.05,
        symbol: 'pin',
        symbolSize: 30,
        itemStyle: {
          color: d.campaignId ? '#F9A825' : '#6F4E37',
        },
        label: {
          formatter: d.isHoliday ? '休' : d.campaignId ? '促' : '',
          color: '#fff',
          fontSize: 10,
        },
      }))
    
    const campaign = campaignId ? CAMPAIGNS.find(c => c.id === campaignId) : null
    const markAreas = campaign ? [[
      {
        name: '活动期',
        xAxis: timeSeriesData.findIndex(d => d.date >= campaign.startDate),
        itemStyle: { color: 'rgba(249, 168, 37, 0.1)' },
      },
      {
        xAxis: timeSeriesData.findIndex(d => d.date > campaign.endDate) - 1,
      },
    ]] : []
    
    return {
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(45, 32, 21, 0.95)',
        borderColor: 'transparent',
        textStyle: { color: '#fff', fontSize: 12 },
        formatter: (params: any) => {
          const data = params[0]
          const item = timeSeriesData[data.dataIndex]
          const metricInfo = METRICS.find(m => m.value === metric)
          let value = data.value
          if (metric === 'sales') value = formatCurrency(value)
          else if (metric === 'loss') value = `${value.toFixed(2)}%`
          else value = value.toLocaleString()
          
          let extra = ''
          if (item.isHoliday) extra += '<br/><span style="color:#F9A825">📅 节假日</span>'
          if (item.campaignId) extra += '<br/><span style="color:#4CAF50">🎯 促销活动</span>'
          
          return `
            <div style="font-weight:600;margin-bottom:4px">${data.name}</div>
            ${metricInfo?.label}: <span style="font-weight:600">${value} ${metricInfo?.unit}</span>
            ${extra}
          `
        },
      },
      grid: {
        left: 60,
        right: 30,
        top: 40,
        bottom: 40,
      },
      xAxis: {
        type: 'category',
        data: dates,
        axisLine: { lineStyle: { color: '#E8DCC8' } },
        axisLabel: { color: '#8B6A3F', fontSize: 11 },
        axisTick: { show: false },
      },
      yAxis: {
        type: 'value',
        splitLine: { lineStyle: { color: '#F5EFE6', type: 'dashed' } },
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: {
          color: '#8B6A3F',
          fontSize: 11,
          formatter: (v: number) => metric === 'sales' ? `${(v / 10000).toFixed(0)}万` : v,
        },
      },
      markArea: {
        data: markAreas,
        silent: true,
      },
      series: [
        {
          name: METRICS.find(m => m.value === metric)?.label,
          type: 'line',
          data: values,
          smooth: true,
          symbol: 'circle',
          symbolSize: 6,
          lineStyle: {
            color: '#6F4E37',
            width: 2.5,
          },
          itemStyle: {
            color: '#6F4E37',
            borderWidth: 2,
            borderColor: '#fff',
          },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(111, 78, 55, 0.25)' },
                { offset: 1, color: 'rgba(111, 78, 55, 0.02)' },
              ],
            },
          },
          markPoint: {
            data: markPoints,
            silent: true,
          },
        },
      ],
    }
  }, [timeSeriesData, metric, campaignId])
  
  const onChartClick = (params: any) => {
    if (params.dataIndex !== undefined) {
      const item = timeSeriesData[params.dataIndex]
      setDrillDown({
        type: 'date',
        value: item.date,
        title: `${item.date} 销售明细`,
      })
    }
  }

  return (
    <ChartCard
      title="销售趋势分析"
      subtitle="时间维度销售表现，支持下钻查看明细"
      sampleSize={timeSeriesData.length}
      actions={
        <div className="flex gap-1 bg-coffee-50 rounded-lg p-1">
          {METRICS.map(m => (
            <button
              key={m.value}
              onClick={() => setMetric(m.value)}
              className={`px-2.5 py-1 text-xs rounded-md transition-all ${
                metric === m.value
                  ? 'bg-white text-coffee-700 shadow-sm font-medium'
                  : 'text-coffee-500 hover:text-coffee-700'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      }
    >
      {isLoading ? (
        <ChartSkeleton height={280} />
      ) : isEmpty || timeSeriesData.length === 0 ? (
        <EmptyState title="暂无趋势数据" description="调整筛选条件后重新查看" />
      ) : (
        <ReactECharts
          option={option}
          style={{ height: 280 }}
          onEvents={{ click: onChartClick }}
          opts={{ renderer: 'canvas' }}
        />
      )}
    </ChartCard>
  )
}
