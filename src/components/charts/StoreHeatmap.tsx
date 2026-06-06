import { useMemo } from 'react'
import ReactECharts from 'echarts-for-react'
import { useDataStore } from '@/store/useDataStore'
import { useFilterStore } from '@/store/useFilterStore'
import ChartCard from '../common/ChartCard'
import EmptyState from '../common/EmptyState'
import { ChartSkeleton } from '../common/LoadingSkeleton'
import { formatCurrency } from '@/utils/formatters'

export default function StoreHeatmap() {
  const storePerformance = useDataStore(state => state.storePerformance)
  const anomalies = useDataStore(state => state.anomalies)
  const isLoading = useDataStore(state => state.isLoading)
  const isEmpty = useDataStore(state => state.isEmpty)
  const selectedStoreId = useDataStore(state => state.selectedStoreId)
  const setSelectedStore = useDataStore(state => state.setSelectedStore)
  const setStoreIds = useFilterStore(state => state.setStoreIds)
  const setDrillDown = useDataStore(state => state.setDrillDown)
  
  const option = useMemo(() => {
    if (storePerformance.length === 0) return {}
    
    const districts = [...new Set(storePerformance.map(s => s.district))]
    const maxSales = Math.max(...storePerformance.map(s => s.totalSales))
    
    const data = storePerformance.map(store => {
      const districtIdx = districts.indexOf(store.district)
      const storeIdx = storePerformance.filter(s => s.district === store.district)
        .findIndex(s => s.storeId === store.storeId)
      
      const hasCriticalAnomaly = anomalies.some(
        a => a.storeId === store.storeId && a.severity === 'critical'
      )
      const hasWarningAnomaly = anomalies.some(
        a => a.storeId === store.storeId && a.severity === 'warning'
      )
      
      return [
        storeIdx,
        districtIdx,
        store.totalSales,
        store.storeId,
        store.storeName,
        hasCriticalAnomaly,
        hasWarningAnomaly,
      ]
    })
    
    return {
      tooltip: {
        backgroundColor: 'rgba(45, 32, 21, 0.95)',
        borderColor: 'transparent',
        textStyle: { color: '#fff', fontSize: 12 },
        formatter: (params: any) => {
          const [, , sales, , storeName, critical, warning] = params.data
          let anomalyText = ''
          if (critical) anomalyText += '<br/><span style="color:#EF4444">🔴 严重异常</span>'
          else if (warning) anomalyText += '<br/><span style="color:#F59E0B">🟡 警告异常</span>'
          
          return `
            <div style="font-weight:600;margin-bottom:4px">${storeName}</div>
            销售额: <span style="font-weight:600">${formatCurrency(sales)}</span>
            ${anomalyText}
          `
        },
      },
      grid: {
        left: 80,
        right: 40,
        top: 30,
        bottom: 40,
      },
      xAxis: {
        type: 'category',
        data: storePerformance
          .filter((s, i, arr) => arr.findIndex(x => x.district === s.district) === i)
          .flatMap(s => {
            const districtStores = storePerformance.filter(x => x.district === s.district)
            return districtStores.map((_, i) => i === Math.floor(districtStores.length / 2) ? s.district : '')
          }),
        axisLine: { lineStyle: { color: '#E8DCC8' } },
        axisLabel: { color: '#8B6A3F', fontSize: 11, interval: 0 },
        axisTick: { show: false },
        splitLine: { show: false },
      },
      yAxis: {
        type: 'category',
        data: districts,
        axisLine: { lineStyle: { color: '#E8DCC8' } },
        axisLabel: { color: '#8B6A3F', fontSize: 11 },
        axisTick: { show: false },
        splitLine: { show: false },
      },
      visualMap: {
        min: 0,
        max: maxSales,
        calculable: true,
        orient: 'horizontal',
        left: 'center',
        bottom: 0,
        textStyle: { color: '#8B6A3F', fontSize: 10 },
        inRange: {
          color: ['#F5EFE6', '#D4BE9D', '#A17F4D', '#6F4E37'],
        },
        formatter: (v: number) => formatCurrency(v),
      },
      series: [
        {
          type: 'heatmap',
          data: data,
          label: {
            show: true,
            formatter: (params: any) => {
              const [, , , , storeName] = params.data
              return storeName.replace('店', '').substring(0, 4)
            },
            color: '#fff',
            fontSize: 10,
            fontWeight: 500,
            textBorderColor: 'rgba(0,0,0,0.3)',
            textBorderWidth: 1,
          },
          itemStyle: {
            borderRadius: 4,
            borderWidth: 2,
            borderColor: '#fff',
          },
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowColor: 'rgba(111, 78, 55, 0.4)',
            },
          },
          markPoint: {
            data: data
              .filter((d: any) => d[5] || d[6])
              .map((d: any) => ({
                xAxis: d[0],
                yAxis: d[1],
                symbol: 'circle',
                symbolSize: 10,
                itemStyle: { color: d[5] ? '#EF4444' : '#F59E0B' },
                label: { show: false },
              })),
            symbolOffset: [15, -15],
          },
        },
      ],
    }
  }, [storePerformance, anomalies])
  
  const onChartClick = (params: any) => {
    if (params.data) {
      const storeId = params.data[3]
      const storeName = params.data[4]
      setSelectedStore(storeId === selectedStoreId ? null : storeId)
      if (storeId !== selectedStoreId) {
        setDrillDown({
          type: 'store',
          value: storeId,
          title: `${storeName} 销售明细`,
        })
      }
    }
  }

  return (
    <ChartCard
      title="门店销售热力图"
      subtitle="按区域分布的门店业绩表现，红点标记异常"
      sampleSize={storePerformance.length}
    >
      {isLoading ? (
        <ChartSkeleton height={300} />
      ) : isEmpty || storePerformance.length === 0 ? (
        <EmptyState title="暂无门店数据" />
      ) : (
        <ReactECharts
          option={option}
          style={{ height: 300 }}
          onEvents={{ click: onChartClick }}
          opts={{ renderer: 'canvas' }}
        />
      )}
    </ChartCard>
  )
}
