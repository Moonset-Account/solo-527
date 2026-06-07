<script setup lang="ts">
import { ref, onMounted, watch, onUnmounted } from 'vue'
import * as d3 from 'd3'
import type { AirQualityReading } from '@/types'
import { POLLUTANT_CONFIG } from '@/types'

const props = defineProps<{
  data: AirQualityReading[]
  pollutants: string[]
}>()

const svgRef = ref<SVGSVGElement | null>(null)
const containerRef = ref<HTMLDivElement | null>(null)

let resizeObserver: ResizeObserver | null = null

const STANDARDS: Record<string, number> = {
  pm25: 75,
  pm10: 150,
  ozone: 160,
  no2: 80,
  so2: 150,
  co: 4,
}

function renderChart() {
  if (!svgRef.value || !containerRef.value || props.data.length === 0) return

  const container = containerRef.value
  const width = container.clientWidth
  const height = container.clientHeight
  const margin = 40
  const radius = Math.min(width, height) / 2 - margin

  d3.select(svgRef.value).selectAll('*').remove()

  const svg = d3.select(svgRef.value)
    .attr('width', width)
    .attr('height', height)

  const g = svg.append('g')
    .attr('transform', `translate(${width / 2},${height / 2})`)

  const activePollutants = props.pollutants.filter(p => p !== 'aqi')
  const angleStep = (2 * Math.PI) / activePollutants.length

  const averages = new Map<string, number>()
  activePollutants.forEach(p => {
    const values = props.data.map(d => (d as any)[p] || 0).filter(v => v > 0)
    averages.set(p, values.length > 0 ? d3.mean(values)! : 0)
  })

  const maxValue = Math.max(
    ...activePollutants.map(p => {
      const val = averages.get(p) || 0
      const std = STANDARDS[p] || 100
      return (val / std) * 100
    })
  ) || 100

  const radialScale = d3.scaleLinear()
    .domain([0, maxValue * 1.2])
    .range([0, radius])

  const levels = [0.25, 0.5, 0.75, 1]
  levels.forEach(level => {
    g.append('circle')
      .attr('r', radialScale(maxValue * level))
      .attr('fill', 'none')
      .attr('stroke', '#e2e8f0')
      .attr('stroke-width', 1)
  })

  activePollutants.forEach((pollutant, i) => {
    const angle = i * angleStep - Math.PI / 2
    const x = Math.cos(angle) * radius
    const y = Math.sin(angle) * radius

    g.append('line')
      .attr('x1', 0)
      .attr('y1', 0)
      .attr('x2', x)
      .attr('y2', y)
      .attr('stroke', '#e2e8f0')
      .attr('stroke-width', 1)

    const config = (POLLUTANT_CONFIG as any)[pollutant]
    const labelRadius = radius + 20
    const labelX = Math.cos(angle) * labelRadius
    const labelY = Math.sin(angle) * labelRadius

    g.append('text')
      .attr('x', labelX)
      .attr('y', labelY)
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .style('font-size', '12px')
      .attr('fill', '#475569')
      .text(config?.name || pollutant)
  })

  const areaPoints = activePollutants.map((pollutant, i) => {
    const angle = i * angleStep - Math.PI / 2
    const value = averages.get(pollutant) || 0
    const std = STANDARDS[pollutant] || 100
    const normalized = (value / std) * 100
    const r = radialScale(normalized)
    return [Math.cos(angle) * r, Math.sin(angle) * r]
  })

  const line = d3.lineRadial()
    .curve(d3.curveLinearClosed)

  const areaData = areaPoints.map((p, i) => {
    const angle = i * angleStep
    return [angle, Math.sqrt(p[0] ** 2 + p[1] ** 2)] as [number, number]
  })

  g.append('path')
    .datum(areaData)
    .attr('d', line as any)
    .attr('fill', '#0d9488')
    .attr('fill-opacity', 0.2)
    .attr('stroke', '#0d9488')
    .attr('stroke-width', 2)
    .attr('transform', `rotate(-90)`)

  activePollutants.forEach((pollutant, i) => {
    const angle = i * angleStep - Math.PI / 2
    const value = averages.get(pollutant) || 0
    const std = STANDARDS[pollutant] || 100
    const normalized = (value / std) * 100
    const r = radialScale(normalized)
    const x = Math.cos(angle) * r
    const y = Math.sin(angle) * r
    const config = (POLLUTANT_CONFIG as any)[pollutant]

    g.append('circle')
      .attr('cx', x)
      .attr('cy', y)
      .attr('r', 5)
      .attr('fill', config?.color || '#0d9488')
      .attr('stroke', 'white')
      .attr('stroke-width', 2)
  })

  const legendData = activePollutants.map(p => {
    const config = (POLLUTANT_CONFIG as any)[p]
    return {
      name: config?.name || p,
      value: averages.get(p)?.toFixed(1) || '0',
      unit: config?.unit || '',
      color: config?.color || '#64748b',
    }
  })

  const legend = svg.append('g')
    .attr('transform', `translate(12, 12)`)

  legendData.forEach((item, idx) => {
    const row = legend.append('g')
      .attr('transform', `translate(0, ${idx * 22})`)

    row.append('rect')
      .attr('width', 10)
      .attr('height', 10)
      .attr('fill', item.color)
      .attr('rx', 2)

    row.append('text')
      .attr('x', 16)
      .attr('y', 9)
      .style('font-size', '11px')
      .attr('fill', '#475569')
      .text(`${item.name}: ${item.value} ${item.unit}`)
  })
}

onMounted(() => {
  if (containerRef.value) {
    resizeObserver = new ResizeObserver(() => {
      renderChart()
    })
    resizeObserver.observe(containerRef.value)
  }
  renderChart()
})

watch(() => [props.data, props.pollutants], () => {
  renderChart()
}, { deep: true })

onUnmounted(() => {
  if (resizeObserver) {
    resizeObserver.disconnect()
  }
})
</script>

<template>
  <div ref="containerRef" class="chart-container w-full h-full">
    <svg ref="svgRef"></svg>
  </div>
</template>
