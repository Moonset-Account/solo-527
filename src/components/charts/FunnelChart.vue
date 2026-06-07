<script setup lang="ts">
import { ref, onMounted, watch, onUnmounted } from 'vue'
import * as d3 from 'd3'
import type { FunnelStep } from '@/types'

const props = defineProps<{
  data: FunnelStep[]
  width?: number
  height?: number
}>()

const chartRef = ref<HTMLDivElement | null>(null)
let resizeObserver: ResizeObserver | null = null

function renderChart() {
  if (!chartRef.value || props.data.length === 0) return

  const containerWidth = chartRef.value.clientWidth || props.width || 500
  const containerHeight = props.height || 350
  const margin = { top: 20, right: 120, bottom: 20, left: 20 }
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

  const maxValue = d3.max(props.data, d => d.value) || 1
  const stepHeight = height / props.data.length

  const colorScale = d3.scaleLinear<string>()
    .domain([0, props.data.length - 1])
    .range(['#165DFF', '#7CB3FF'])

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

  props.data.forEach((d, i) => {
    const nextValue = i < props.data.length - 1 ? props.data[i + 1].value : 0
    const topWidth = (d.value / maxValue) * width
    const bottomWidth = (nextValue / maxValue) * width
    const y = i * stepHeight

    const pathD = `
      M ${(width - topWidth) / 2} ${y}
      L ${(width + topWidth) / 2} ${y}
      L ${(width + bottomWidth) / 2} ${y + stepHeight - 2}
      L ${(width - bottomWidth) / 2} ${y + stepHeight - 2}
      Z
    `

    const group = svg.append('g')
      .style('cursor', 'pointer')

    group.append('path')
      .attr('d', pathD)
      .attr('fill', d.lowSample ? '#f97316' : colorScale(i))
      .attr('opacity', 0.85)
      .style('transition', 'opacity 0.2s')

    group.on('mouseover', function(event) {
        d3.select(this).select('path').attr('opacity', 1)
        tooltip.style('visibility', 'visible')
          .html(`
            <div><strong>${d.name}</strong></div>
            <div>人数: ${d.value.toLocaleString()}</div>
            <div>转化率: ${d.conversionRate}%</div>
            <div>样本量: n=${d.sampleSize}</div>
            ${d.lowSample ? '<div style="color:#f97316">样本不足</div>' : ''}
          `)
      })
      .on('mousemove', function(event) {
        tooltip.style('top', (event.offsetY - 80) + 'px')
          .style('left', (event.offsetX + 10) + 'px')
      })
      .on('mouseout', function() {
        d3.select(this).select('path').attr('opacity', 0.85)
        tooltip.style('visibility', 'hidden')
      })

    group.append('text')
      .attr('x', width / 2)
      .attr('y', y + stepHeight / 2 - 6)
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .style('font-size', '13px')
      .style('font-weight', '600')
      .style('fill', '#fff')
      .text(d.name)

    group.append('text')
      .attr('x', width / 2)
      .attr('y', y + stepHeight / 2 + 12)
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .style('font-size', '11px')
      .style('fill', 'rgba(255,255,255,0.9)')
      .text(`${d.value.toLocaleString()}人 · ${d.conversionRate}%`)

    if (i < props.data.length - 1) {
      svg.append('text')
        .attr('x', width + 20)
        .attr('y', y + stepHeight / 2 + 5)
        .attr('text-anchor', 'start')
        .style('font-size', '11px')
        .style('fill', '#6b7280')
        .text(`n=${d.sampleSize}`)
    }
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
