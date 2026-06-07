<script setup lang="ts">
import { ref, onMounted, watch, onUnmounted } from 'vue'
import * as d3 from 'd3'
import type { AirQualityReading } from '@/types'
import { POLLUTANT_CONFIG } from '@/types'

const props = defineProps<{
  data: AirQualityReading[]
  pollutants: string[]
  stationNames?: Map<string, string>
}>()

const svgRef = ref<SVGSVGElement | null>(null)
const containerRef = ref<HTMLDivElement | null>(null)
const tooltip = ref<HTMLDivElement | null>(null)

let resizeObserver: ResizeObserver | null = null

function getValue(d: AirQualityReading, pollutant: string): number {
  return (d as any)[pollutant] || 0
}

function renderChart() {
  if (!svgRef.value || !containerRef.value || props.data.length === 0) return

  const container = containerRef.value
  const width = container.clientWidth
  const height = container.clientHeight
  const margin = { top: 20, right: 80, bottom: 40, left: 50 }

  const innerWidth = width - margin.left - margin.right
  const innerHeight = height - margin.top - margin.bottom

  d3.select(svgRef.value).selectAll('*').remove()

  const svg = d3.select(svgRef.value)
    .attr('width', width)
    .attr('height', height)

  const g = svg.append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`)

  const parseTime = d3.isoParse
  const xExtent = d3.extent(props.data, d => parseTime(d.timestamp)!)
  const xScale = d3.scaleTime()
    .domain(xExtent as [Date, Date])
    .range([0, innerWidth])

  const yMax = d3.max(props.data, d => {
    return d3.max(props.pollutants, p => getValue(d, p))!
  })! || 100

  const yScale = d3.scaleLinear()
    .domain([0, yMax * 1.1])
    .range([innerHeight, 0])
    .nice()

  const xAxis = d3.axisBottom(xScale)
    .ticks(6)
    .tickFormat(d3.timeFormat('%m-%d %H:%M') as any)

  const yAxis = d3.axisLeft(yScale).ticks(5)

  g.append('g')
    .attr('transform', `translate(0,${innerHeight})`)
    .attr('class', 'x-axis')
    .call(xAxis)
    .selectAll('text')
    .attr('fill', '#64748b')
    .style('font-size', '11px')

  g.append('g')
    .attr('class', 'y-axis')
    .call(yAxis)
    .selectAll('text')
    .attr('fill', '#64748b')
    .style('font-size', '11px')

  g.selectAll('.domain').attr('stroke', '#e2e8f0')
  g.selectAll('.tick line').attr('stroke', '#e2e8f0')

  g.append('g')
    .attr('class', 'grid')
    .attr('opacity', 0.3)
    .call(d3.axisLeft(yScale).ticks(5).tickSize(-innerWidth).tickFormat('' as any))
    .selectAll('.domain').remove()

  g.selectAll('.grid .tick line').attr('stroke', '#e2e8f0')

  const groupedByStation = d3.group(props.data, d => d.stationId)
  const stationIds = Array.from(groupedByStation.keys()).slice(0, 5)

  props.pollutants.forEach((pollutant, pIdx) => {
    stationIds.forEach((stationId, sIdx) => {
      const stationData = groupedByStation.get(stationId) || []
      const sortedData = [...stationData].sort((a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      )

      const config = (POLLUTANT_CONFIG as any)[pollutant]
      const color = config?.color || '#64748b'

      const line = d3.line<AirQualityReading>()
        .x(d => xScale(parseTime(d.timestamp)!))
        .y(d => yScale(getValue(d, pollutant)))
        .curve(d3.curveMonotoneX)

      g.append('path')
        .datum(sortedData)
        .attr('fill', 'none')
        .attr('stroke', color)
        .attr('stroke-width', 1.5)
        .attr('stroke-opacity', 0.3 + (stationIds.length - sIdx) * 0.15)
        .attr('d', line)
        .attr('class', 'line-path')
        .style('transition', 'opacity 0.3s')

      const points = g.selectAll(`.point-${stationId}-${pollutant}`)
        .data(sortedData)
        .enter()
        .append('circle')
        .attr('class', `point-${stationId}-${pollutant}`)
        .attr('cx', d => xScale(parseTime(d.timestamp)!))
        .attr('cy', d => yScale(getValue(d, pollutant)))
        .attr('r', 0)
        .attr('fill', color)
        .style('cursor', 'pointer')

      points.on('mouseenter', function(event, d) {
        d3.select(this).transition().attr('r', 5)
        if (tooltip.value) {
          const stationName = props.stationNames?.get(d.stationId) || d.stationId
          tooltip.value.innerHTML = `
            <div class="font-medium mb-1">${stationName}</div>
            <div class="text-slate-300">${new Date(d.timestamp).toLocaleString('zh-CN')}</div>
            <div style="color: ${color}">${config?.name || pollutant}: ${getValue(d, pollutant)} ${config?.unit || ''}</div>
          `
          tooltip.value.style.display = 'block'
          tooltip.value.style.left = `${event.pageX + 10}px`
          tooltip.value.style.top = `${event.pageY - 10}px`
        }
      })
      .on('mouseleave', function() {
        d3.select(this).transition().attr('r', 0)
        if (tooltip.value) {
          tooltip.value.style.display = 'none'
        }
      })
    })
  })

  const legend = svg.append('g')
    .attr('transform', `translate(${margin.left}, 0)`)

  props.pollutants.forEach((pollutant, idx) => {
    const config = (POLLUTANT_CONFIG as any)[pollutant]
    const legendItem = legend.append('g')
      .attr('transform', `translate(${idx * 100}, 0)`)

    legendItem.append('line')
      .attr('x1', 0)
      .attr('y1', 8)
      .attr('x2', 20)
      .attr('y2', 8)
      .attr('stroke', config?.color || '#64748b')
      .attr('stroke-width', 2)

    legendItem.append('text')
      .attr('x', 25)
      .attr('y', 12)
      .style('font-size', '12px')
      .attr('fill', '#475569')
      .text(config?.name || pollutant)
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
    <div
      ref="tooltip"
      class="tooltip"
      style="display: none;"
    ></div>
  </div>
</template>
