import { useRef, useEffect } from 'react'
import * as echarts from 'echarts'

interface ChartContainerProps {
  option: Record<string, any>
  height?: string
  onChartClick?: (params: any) => void
}

export default function ChartContainer({ option, height = '300px', onChartClick }: ChartContainerProps) {
  const chartRef = useRef<HTMLDivElement>(null)
  const instanceRef = useRef<echarts.ECharts | null>(null)

  useEffect(() => {
    if (!chartRef.current) return
    if (!instanceRef.current) {
      instanceRef.current = echarts.init(chartRef.current, 'dark')
    }
    instanceRef.current.setOption(option, true)

    if (onChartClick) {
      instanceRef.current.off('click')
      instanceRef.current.on('click', onChartClick)
    }

    const handleResize = () => instanceRef.current?.resize()
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [option, onChartClick])

  useEffect(() => {
    return () => {
      instanceRef.current?.dispose()
      instanceRef.current = null
    }
  }, [])

  return <div ref={chartRef} style={{ width: '100%', height }} />
}
