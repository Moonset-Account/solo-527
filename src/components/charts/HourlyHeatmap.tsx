import { useMemo } from 'react'
import ReactECharts from 'echarts-for-react'
import { useDataStore } from '@/store/useDataStore'
import ChartCard from '../common/ChartCard'
import EmptyState from '../common/EmptyState'
import { ChartSkeleton } from '../common/LoadingSkeleton'
import { getWeekdayLabel } from '@/utils/formatters'

export default function HourlyHeatmap() {
  const hourlyHeatmap = useDataStore(state => state.hourlyHeatmap)
  const isLoading = useDataStore(state => state.isLoading)
  const isEmpty = useDataStore(state => state.isEmpty)
  
  const option = useMemo(() => {
    if (hourlyHeatmap.length === 0) return {}
    
    const weekdays = [1, 2, 3, 4, 5, 6, 0]
    const hours = Array.from({ length: 16 }, (_, i) => i + 7)
    
    const maxOrders = Math.max(...hourlyHeatmap.map(h => h.orderCount))
    
    const data = hourlyHeatmap.map(h => {
      const x = hours.indexOf(h.hour)
      const y = weekdays.indexOf(h.weekday)
      return [x >= 0 ? x : h.hour - 7, y, h.orderCount, h.salesAmount]
    }).filter(d => d[0] >= 0 && d[0] < 16)
    
    return {
      tooltip: {
        backgroundColor: 'rgba(45, 32, 21, 0.95)',
        borderColor: 'transparent',
        textStyle: { color: '#fff', fontSize: 12 },
        formatter: (params: any) => {
          const [hourIdx, weekdayIdx, orders, sales] = params.data
          const hour = hours[hourIdx]
          const weekday = weekdays[weekdayIdx]
          return `
            <div style="font-weight:600;margin-bottom:4px">${getWeekdayLabel(weekday)} ${hour}:00-${hour + 1}:00</div>
            订单数: <span style="font-weight:600">${orders} 单</span><br/>
            销售额: <span style="font-weight:600">¥${sales.toLocaleString()}</span>
          `
        },
      },
      grid: {
        left: 70,
        right: 30,
        top: 20,
        bottom: 40,
      },
      xAxis: {
        type: 'category',
        data: hours.map(h => `${h}:00`),
        splitArea: { show: true, areaStyle: { color: ['#fff', '#FDF8F3'] } },
        axisLine: { lineStyle: { color: '#E8DCC8' } },
        axisLabel: { color: '#8B6A3F', fontSize: 10 },
        axisTick: { show: false },
      },
      yAxis: {
        type: 'category',
        data: weekdays.map(d => getWeekdayLabel(d)),
        splitArea: { show: true },
        axisLine: { lineStyle: { color: '#E8DCC8' } },
        axisLabel: { color: '#8B6A3F', fontSize: 11 },
        axisTick: { show: false },
      },
      visualMap: {
        min: 0,
        max: maxOrders,
        calculable: true,
        orient: 'horizontal',
        left: 'center',
        bottom: 0,
        textStyle: { color: '#8B6A3F', fontSize: 10 },
        inRange: {
          color: ['#FDF8F3', '#E8DCC8', '#B89A6E', '#8B6A3F', '#6F4E37'],
        },
      },
      series: [
        {
          type: 'heatmap',
          data: data,
          label: {
            show: true,
            formatter: (params: any) => params.data[2],
            color: '#fff',
            fontSize: 10,
            fontWeight: 500,
            textBorderColor: 'rgba(0,0,0,0.2)',
            textBorderWidth: 1,
          },
          itemStyle: {
            borderRadius: 3,
            borderWidth: 1,
            borderColor: '#fff',
          },
          emphasis: {
            itemStyle: {
              shadowBlur: 8,
              shadowColor: 'rgba(111, 78, 55, 0.4)',
            },
          },
        },
      ],
    }
  }, [hourlyHeatmap])

  return (
    <ChartCard
      title="时段销量热力图"
      subtitle="星期×时段二维分布，识别销售高峰低谷"
    >
      {isLoading ? (
        <ChartSkeleton height={260} />
      ) : isEmpty || hourlyHeatmap.length === 0 ? (
        <EmptyState title="暂无时段数据" />
      ) : (
        <ReactECharts
          option={option}
          style={{ height: 260 }}
          opts={{ renderer: 'canvas' }}
        />
      )}
    </ChartCard>
  )
}
