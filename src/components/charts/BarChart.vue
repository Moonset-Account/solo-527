<script setup lang="ts">
import { ref, onMounted, watch, onUnmounted } from 'vue'
import * as d3 from 'd3'
import type { MedicineComparison } from '@/types'

const props = defineProps<{
  data: MedicineComparison[]
  width?: number
  height?: number
}>()

const chartRef = ref<HTMLDivElement | null>(null)
let resizeObserver: ResizeObserver | null = null

function renderChart() {
  if (!chartRef.value || props.data.length === 0) return

  const containerWidth = chartRef.value.clientWidth || props.width || 600
  const containerHeight = props.height || 350
  const margin = { top: 30, right: 30, bottom: 60, left: 50 }
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

  const categories = props.data.map(d => d.category)
  const maxValue = d3.max(props.data, d => Math.max(d.beforeActivity, d.afterActivity)) || 100

  const x0 = d3.scaleBand()
    .domain(categories)
    .range([0, width])
    .paddingInner(0.2)

  const x1 = d3.scaleBand()
    .domain(['before', 'after'])
    .range([0, x0.bandwidth()])
    .padding(0.05)

  const y = d3.scaleLinear()
    .domain([0, maxValue * 1.1])
    .range([height, 0])

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

  svg.append('g')
    .attr('transform', `translate(0,${height})`)
    .call(d3.axisBottom(x0))
    .selectAll('text')
    .style('font-size', '11px')
    .style('fill', '#4b5563')
    .attr('transform', 'rotate(-30)')
    .style('text-anchor', 'end')

  svg.append('g')
    .call(d3.axisLeft(y).ticks(5))
    .selectAll('text')
    .style('font-size', '11px')
    .style('fill', '#6b7280')

  const groups = svg.selectAll<SVGGElement, MedicineComparison>('.bar-group')
    .data(props.data)
    .enter()
    .append('g')
    .attr('class', 'bar-group')
    .attr('transform', d => `translate(${x0(d.category) || 0},0)`)

  groups.append('rect')
    .attr('x', x1('before') || 0)
    .attr('y', d => y(d.beforeActivity))
    .attr('width', x1.bandwidth())
    .attr('height', d => height - y(d.beforeActivity))
    .attr('fill', '#94A3B8')
    .attr('rx', 3)
    .style('cursor', 'pointer')
    .on('mouseover', function(_event, d) {
      d3.select(this).attr('fill', '#64748B')
      tooltip.style('visibility', 'visible')
        .html(`
          <div><strong>${d.category}</strong></div>
          <div>活动前: ${d.beforeActivity.toLocaleString()}</div>
          <div>样本量: n=${d.sampleSize}</div>
        `)
    })
    .on('mousemove', function(event: MouseEvent) {
      tooltip.style('top', (event.offsetY - 60) + 'px')
        .style('left', (event.offsetX + 10) + 'px')
    })
    .on('mouseout', function() {
      d3.select(this).attr('fill', '#94A3B8')
      tooltip.style('visibility', 'hidden')
    })

  groups.append('rect')
    .attr('x', x1('after') || 0)
    .attr('y', d => y(d.afterActivity))
    .attr('width', x1.bandwidth())
    .attr('height', d => height - y(d.afterActivity))
    .attr('fill', d => d.lowSample ? '#f97316' : '#165DFF')
    .attr('rx', 3)
    .style('cursor', 'pointer')
    .on('mouseover', function(_event, d) {
      d3.select(this).attr('fill', d.lowSample ? '#ea580c' : '#0E4BCC')
      tooltip.style('visibility', 'visible')
        .html(`
          <div><strong>${d.category}</strong></div>
          <div>活动后: ${d.afterActivity.toLocaleString()}</div>
          <div>增长率: ${d.growthRate > 0 ? '+' : ''}${d.growthRate}%</div>
          <div>样本量: ${d.lowSample ? 'n<10' : 'n=' + d.sampleSize}</div>
        `)
    })
    .on('mousemove', function(event: MouseEvent) {
      tooltip.style('top', (event.offsetY - 70) + 'px')
        .style('left', (event.offsetX + 10) + 'px')
    })
    .on('mouseout', function(_event, d) {
      d3.select(this).attr('fill', d.lowSample ? '#f97316' : '#165DFF')
      tooltip.style('visibility', 'hidden')
    })

  groups.append('text')
    .attr('x', x0.bandwidth() / 2)
    .attr('y', d => y(Math.max(d.beforeActivity, d.afterActivity)) - 5)
    .attr('text-anchor', 'middle')
    .style('font-size', '11px')
    .style('font-weight', '600')
    .style('fill', d => d.growthRate >= 0 ? '#00B42A' : '#F53F3F')
    .text(d => `${d.growthRate > 0 ? '+' : ''}${d.growthRate}%`)

  const legend = svg.append('g')
    .attr('transform', `translate(${width - 150}, -15)`)

  legend.append('rect')
    .attr('x', 0)
    .attr('y', 0)
    .attr('width', 12)
    .attr('height', 12)
    .attr('fill', '#94A3B8')
    .attr('rx', 2)

  legend.append('text')
    .attr('x', 20)
    .attr('y', 10)
    .style('font-size', '11px')
    .style('fill', '#6b7280')
    .text('活动前')

  legend.append('rect')
    .attr('x', 70)
    .attr('y', 0)
    .attr('width', 12)
    .attr('height', 12)
    .attr('fill', '#165DFF')
    .attr('rx', 2)

  legend.append('text')
    .attr('x', 90)
    .attr('y', 10)
    .style('font-size', '11px')
    .style('fill', '#6b7280')
    .text('活动后')
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
