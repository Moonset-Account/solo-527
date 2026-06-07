<script setup lang="ts">
import { ref, onMounted, watch, onUnmounted } from 'vue'
import * as d3 from 'd3'
import type { PriceTrendPoint } from '@/types'

const props = defineProps<{
  data: PriceTrendPoint[]
  width?: number
  height?: number
}>()

const chartRef = ref<HTMLDivElement | null>(null)
let svg: d3.Selection<SVGGElement, unknown, null, undefined> | null = null
let resizeObserver: ResizeObserver | null = null

function renderChart() {
  if (!chartRef.value || props.data.length === 0) return

  const containerWidth = chartRef.value.clientWidth || props.width || 600
  const containerHeight = props.height || 300
  const margin = { top: 20, right: 30, bottom: 40, left: 50 }
  const width = containerWidth - margin.left - margin.right
  const height = containerHeight - margin.top - margin.bottom

  d3.select(chartRef.value).selectAll('svg').remove()

  const svgRoot = d3.select(chartRef.value)
    .append('svg')
    .attr('width', containerWidth)
    .attr('height', containerHeight)

  svg = svgRoot.append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`)

  const x = d3.scaleBand()
    .domain(props.data.map(d => d.date))
    .range([0, width])
    .padding(0.1)

  const y = d3.scaleLinear()
    .domain([0, d3.max(props.data, d => d.avgOrderValue) || 100])
    .nice()
    .range([height, 0])

  const line = d3.line<PriceTrendPoint>()
    .x(d => (x(d.date) || 0) + x.bandwidth() / 2)
    .y(d => y(d.avgOrderValue))
    .curve(d3.curveMonotoneX)

  svg.append('g')
    .attr('transform', `translate(0,${height})`)
    .call(d3.axisBottom(x).tickValues(x.domain().filter((_, i) => i % 2 === 0)))
    .selectAll('text')
    .style('font-size', '10px')
    .style('fill', '#6b7280')

  svg.append('g')
    .call(d3.axisLeft(y).ticks(5))
    .selectAll('text')
    .style('font-size', '10px')
    .style('fill', '#6b7280')

  svg.append('g')
    .call(d3.axisLeft(y).ticks(5))
    .select('.domain').remove()

  svg.append('path')
    .datum(props.data)
    .attr('fill', 'none')
    .attr('stroke', '#165DFF')
    .attr('stroke-width', 2)
    .attr('d', line)

  const area = d3.area<PriceTrendPoint>()
    .x(d => (x(d.date) || 0) + x.bandwidth() / 2)
    .y0(height)
    .y1(d => y(d.avgOrderValue))
    .curve(d3.curveMonotoneX)

  svg.append('path')
    .datum(props.data)
    .attr('fill', 'url(#gradient)')
    .attr('opacity', 0.1)
    .attr('d', area)

  const defs = svg.append('defs')
  const gradient = defs.append('linearGradient')
    .attr('id', 'gradient')
    .attr('x1', '0%')
    .attr('y1', '0%')
    .attr('x2', '0%')
    .attr('y2', '100%')

  gradient.append('stop')
    .attr('offset', '0%')
    .attr('stop-color', '#165DFF')
    .attr('stop-opacity', 0.3)

  gradient.append('stop')
    .attr('offset', '100%')
    .attr('stop-color', '#165DFF')
    .attr('stop-opacity', 0)

  svg.selectAll('.dot')
    .data(props.data)
    .enter()
    .append('circle')
    .attr('class', 'dot')
    .attr('cx', d => (x(d.date) || 0) + x.bandwidth() / 2)
    .attr('cy', d => y(d.avgOrderValue))
    .attr('r', 4)
    .attr('fill', d => d.lowSample ? '#f97316' : '#165DFF')
    .attr('stroke', '#fff')
    .attr('stroke-width', 2)

  const tooltip = d3.select(chartRef.value)
    .append('div')
    .style('position', 'absolute')
    .style('visibility', 'hidden')
    .style('background', 'rgba(0,0,0,0.8)')
    .style('color', '#fff')
    .style('padding', '8px 12px')
    .style('border-radius', '4px')
    .style('font-size', '12px')
    .style('pointer-events', 'none')
    .style('z-index', '100')

  svg.selectAll<SVGCircleElement, PriceTrendPoint>('.dot')
    .on('mouseover', function(_event, d) {
      d3.select(this).attr('r', 6)
      tooltip.style('visibility', 'visible')
        .html(`
          <div><strong>${d.date}</strong></div>
          <div>客单价: ¥${d.avgOrderValue.toFixed(2)}</div>
          <div>样本量: n=${d.sampleSize}</div>
          ${d.lowSample ? '<div style="color:#f97316">样本不足</div>' : ''}
        `)
    })
    .on('mousemove', function(event: MouseEvent) {
      tooltip.style('top', (event.offsetY - 10) + 'px')
        .style('left', (event.offsetX + 10) + 'px')
    })
    .on('mouseout', function() {
      d3.select(this).attr('r', 4)
      tooltip.style('visibility', 'hidden')
    })
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
