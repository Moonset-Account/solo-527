import { useMemo } from 'react'
import ReactECharts from 'echarts-for-react'
import { useDataStore } from '@/store/useDataStore'
import ChartCard from '../common/ChartCard'
import EmptyState from '../common/EmptyState'
import { ChartSkeleton } from '../common/LoadingSkeleton'
import { WEATHER_TYPES } from '@/data/mock/seedData'
import { formatCurrency } from '@/utils/formatters'

export default function WeatherImpactChart() {
  const weatherImpact = useDataStore(state => state.weatherImpact)
  const isLoading = useDataStore(state => state.isLoading)
  const isEmpty = useDataStore(state => state.isEmpty)
  const setDrillDown = useDataStore(state => state.setDrillDown)
  
  const option = useMemo(() => {
    if (weatherImpact.length === 0) return {}
    
    const data = weatherImpact.map(item => {
      const weatherInfo = WEATHER_TYPES.find(w => w.type === item.weatherType)
      return {
        type: item.weatherType,
        label: weatherInfo?.label || item.weatherType,
        icon: weatherInfo?.icon || '🌤️',
        sales: item.avgSales,
        orders: item.avgOrders,
        index: item.salesIndex,
        sampleSize: item.sampleSize,
      }
    }).sort((a, b) => b.sales - a.sales)
    
    return {
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(45, 32, 21, 0.95)',
        borderColor: 'transparent',
        textStyle: { color: '#fff', fontSize: 12 },
        axisPointer: { type: 'shadow' },
        formatter: (params: any) => {
          const sales = params[0]
          const orders = params[1]
          const item = data.find(d => d.label === sales.name)
          return `
            <div style="font-weight:600;margin-bottom:4px">${item?.icon} ${sales.name}</div>
            日均销售额: <span style="font-weight:600">${formatCurrency(sales.value)}</span><br/>
            日均订单数: <span style="font-weight:600">${orders.value} 单</span><br/>
            销售指数: <span style="font-weight:600">${((item?.index || 1) * 100).toFixed(0)}%</span><br/>
            样本量: ${item?.sampleSize} 天
          `
        },
      },
      legend: {
        data: ['日均销售额', '日均订单数'],
        bottom: 0,
        textStyle: { color: '#8B6A3F', fontSize: 11 },
        itemGap: 20,
      },
      grid: {
        left: 60,
        right: 60,
        top: 20,
        bottom: 50,
      },
      xAxis: {
        type: 'category',
        data: data.map(d => `${d.icon} ${d.label}`),
        axisLine: { lineStyle: { color: '#E8DCC8' } },
        axisLabel: { color: '#8B6A3F', fontSize: 11, interval: 0 },
        axisTick: { show: false },
      },
      yAxis: [
        {
          type: 'value',
          name: '销售额',
          splitLine: { lineStyle: { color: '#F5EFE6', type: 'dashed' } },
          axisLine: { show: false },
          axisTick: { show: false },
          axisLabel: {
            color: '#8B6A3F',
            fontSize: 10,
            formatter: (v: number) => `${(v / 1000).toFixed(0)}k`,
          },
        },
        {
          type: 'value',
          name: '订单数',
          splitLine: { show: false },
          axisLine: { show: false },
          axisTick: { show: false },
          axisLabel: { color: '#8B6A3F', fontSize: 10 },
        },
      ],
      series: [
        {
          name: '日均销售额',
          type: 'bar',
          data: data.map(d => d.sales),
          barWidth: '35%',
          itemStyle: {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: '#8B6A3F' },
                { offset: 1, color: '#6F4E37' },
              ],
            },
            borderRadius: [4, 4, 0, 0],
          },
        },
        {
          name: '日均订单数',
          type: 'line',
          yAxisIndex: 1,
          data: data.map(d => d.orders),
          smooth: true,
          symbol: 'circle',
          symbolSize: 6,
          lineStyle: { color: '#2E7D32', width: 2 },
          itemStyle: { color: '#2E7D32', borderWidth: 2, borderColor: '#fff' },
        },
      ],
    }
  }, [weatherImpact])
  
  const onChartClick = (params: any) => {
    if (params.name) {
      const weatherType = weatherImpact.find(w => {
        const info = WEATHER_TYPES.find(t => t.type === w.weatherType)
        return `${info?.icon} ${info?.label}` === params.name
      })
      if (weatherType) {
        setDrillDown({
          type: 'weather',
          value: weatherType.weatherType,
          title: `${params.name} 天气销售明细`,
        })
      }
    }
  }

  return (
    <ChartCard
      title="天气影响分析"
      subtitle="不同天气类型下的销售表现对比"
      sampleSize={weatherImpact.reduce((sum, w) => sum + w.sampleSize, 0)}
    >
      {isLoading ? (
        <ChartSkeleton height={280} />
      ) : isEmpty || weatherImpact.length === 0 ? (
        <EmptyState title="暂无天气数据" />
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
