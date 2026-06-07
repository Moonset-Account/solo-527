import { useEffect, useRef } from 'react'
import * as echarts from 'echarts'

interface EChartsWrapperProps {
  option: echarts.EChartsOption
  style?: React.CSSProperties
  className?: string
}

export default function EChartsWrapper({ option, style, className }: EChartsWrapperProps) {
  const chartRef = useRef<HTMLDivElement>(null)
  const instanceRef = useRef<echarts.ECharts | null>(null)

  useEffect(() => {
    if (!chartRef.current) return
    instanceRef.current = echarts.init(chartRef.current)
    return () => {
      instanceRef.current?.dispose()
    }
  }, [])

  useEffect(() => {
    instanceRef.current?.setOption(option, true)
  }, [option])

  useEffect(() => {
    const handleResize = () => instanceRef.current?.resize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return <div ref={chartRef} className={className} style={style} />
}
