<script setup lang="ts">
import { ref, onMounted, watch, onUnmounted } from 'vue'
import * as d3 from 'd3'
import type { CohortData } from '@/types'

const props = defineProps<{
  data: CohortData[]
  width?: number
  height?: number
}>()

const chartRef = ref<HTMLDivElement | null>(null)
let resizeObserver: ResizeObserver | null = null

function renderChart() {
  if (!chartRef.value || props.data.length === 0) return

  const containerWidth = chartRef.value.clientWidth || props.width || 700
  const containerHeight = props.height || 350
  const margin = { top: 40, right: 30, bottom: 30, left: 100 }
  const width = containerWidth - margin.left - margin.right
  const height = containerHeight - margin.top - margin.bottom

  d3.select(chartRef.value).selectAll('svg').remove()
  d3.select(chartRef.value).selectAll('.d3-tooltip').remove()

  const svg = d3.select(chartRef.value)
    .append('svg')
    .attr('width', containerWidth)
    .attr('height', containerHeight)
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`)

  const maxPeriods = d3.max(props.data, d => d.cells.length) || 1
  const xLabels = Array.from({ length: maxPeriods }, (_, i) => `第${i + 1}期`)
  const yLabels = props.data.map(d => d.cohort)

  const x = d3.scaleBand()
    .domain(xLabels)
    .range([0, width])
    .padding(0.05)

  const y = d3.scaleBand()
    .domain(yLabels)
    .range([0, height])
    .padding(0.05)

  const colorScale = d3.scaleSequential()
    .interpolator(d3.interpolateBlues)
    .domain([0, 100])

  svg.append('g')
    .attr('transform', `translate(0,0)`)
    .call(d3.axisTop(x).tickSize(0))
    .selectAll('text')
    .style('font-size', '11px')
    .style('fill', '#4b5563')

  svg.selectAll('.domain, .tick line').remove()

  svg.append('g')
    .call(d3.axisLeft(y).tickSize(0))
    .selectAll('text')
    .style('font-size', '11px')
    .style('fill', '#4b5563')

  svg.selectAll('.domain').remove()

  interface CohortFlatData {
    cohort: string
    period: string
    periodNum: number
    value: number
    sampleSize: number
    lowSample: boolean
  }

  const flatData: CohortFlatData[] = []

  props.data.forEach(d => {
    d.cells.forEach(cell => {
      flatData.push({
        cohort: d.cohort,
        period: cell.period,
        periodNum: cell.periodNum,
        value: cell.retentionRate,
        sampleSize: cell.sampleSize,
        lowSample: cell.lowSample
      })
    })
  })

  const tooltip = d3.select(chartRef.value)
    .append('div')
    .attr('class', 'd3-tooltip')
    .style('position', 'absolute')
    .style('visibility', 'hidden')
    .style('background', 'rgba(17, 24, 39, 0.95)')
    .style('color', '#fff')
    .style('padding', '10px 12px')
    .style('border-radius', '6px')
    .style('font-size', '12px')
    .style('line-height', '1.6')
    .style('pointer-events', 'none')
    .style('z-index', '100')
    .style('box-shadow', '0 4px 12px rgba(0,0,0,0.15)')

  const cells = svg.selectAll<SVGRectElement, CohortFlatData>('.cell')
    .data(flatData)
    .enter()
    .append('rect')
    .attr('class', 'cell')
    .attr('x', d => x(d.period) || 0)
    .attr('y', d => y(d.cohort) || 0)
    .attr('width', x.bandwidth())
    .attr('height', y.bandwidth())
    .attr('rx', 3)
    .attr('fill', d => d.lowSample ? '#fef3c7' : colorScale(d.value))
    .attr('stroke', '#fff')
    .attr('stroke-width', 2)
    .style('cursor', 'pointer')
    .style('transition', 'all 0.2s')

  cells.on('mouseover', function(_event, d) {
      d3.select(this)
        .attr('stroke', '#165DFF')
        .attr('stroke-width', 2)
      tooltip.style('visibility', 'visible')
        .html(`
          <div><strong>${d.cohort} - ${d.period}</strong></div>
          <div>留存率: ${d.lowSample ? '样本不足' : d.value + '%'}</div>
          <div>样本量: ${d.lowSample ? 'n<10' : 'n=' + d.sampleSize}</div>
        `)
    })
    .on('mousemove', function(event: MouseEvent) {
      const rect = chartRef.value?.getBoundingClientRect()
      if (rect) {
        tooltip.style('top', (event.offsetY - 70) + 'px')
          .style('left', (event.offsetX + 10) + 'px')
      }
    })
    .on('mouseout', function() {
      d3.select(this)
        .attr('stroke', '#fff')
        .attr('stroke-width', 2)
      tooltip.style('visibility', 'hidden')
    })

  svg.selectAll<SVGTextElement, CohortFlatData>('.value-label')
    .data(flatData)
    .enter()
    .append('text')
    .attr('class', 'value-label')
    .attr('x', d => (x(d.period) || 0) + x.bandwidth() / 2)
    .attr('y', d => (y(d.cohort) || 0) + y.bandwidth() / 2 - 4)
    .attr('text-anchor', 'middle')
    .attr('dominant-baseline', 'middle')
    .style('font-size', '10px')
    .style('font-weight', '500')
    .style('fill', d => d.lowSample || d.value > 40 ? '#1f2937' : '#fff')
    .text(d => d.lowSample ? '?' : d.value + '%')

  svg.selectAll<SVGTextElement, CohortFlatData>('.sample-label')
    .data(flatData)
    .enter()
    .append('text')
    .attr('class', 'sample-label')
    .attr('x', d => (x(d.period) || 0) + x.bandwidth() / 2)
    .attr('y', d => (y(d.cohort) || 0) + y.bandwidth() / 2 + 10)
    .attr('text-anchor', 'middle')
    .attr('dominant-baseline', 'middle')
    .style('font-size', '9px')
    .style('fill', d => d.lowSample || d.value > 40 ? '#6b7280' : 'rgba(255,255,255,0.8)')
    .text(d => d.lowSample ? 'n<10' : 'n=' + d.sampleSize)
}

onMounted(() => {
  renderChart()
  if (chartRef.value) {
    resizeObserver = new ResizeObserver(() => {
      renderChart()
    })
    resizeObserver.observe(chartRef.value)
  }
})

watch(() => props.data, () => {
  renderChart()
}, { deep: true })

onUnmounted(() => {
  if (resizeObserver) {
    resizeObserver.disconnect()
  }
})
</script>

<template>
  <div ref="chartRef" class="relative w-full"></div>
</template>
