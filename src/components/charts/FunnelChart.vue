<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from 'vue'
import * as d3 from 'd3'
import type { FunnelData } from '@/types'
import { formatNumber, formatPercent } from '@/utils/format'

const props = defineProps<{
  data: FunnelData[]
  width?: number
  height?: number
}>()

const emit = defineEmits<{
  (e: 'stage-click', stage: FunnelData): void
}>()

const containerRef = ref<HTMLDivElement | null>(null)
const tooltipRef = ref<HTMLDivElement | null>(null)

const colors = ['#06B6D4', '#0891B2', '#0E7490', '#155E75']

function drawChart() {
  if (!containerRef.value || !props.data?.length) return

  const container = containerRef.value
  d3.select(container).selectAll('*').remove()

  const width = props.width || container.clientWidth || 500
  const height = props.height || 320
  const margin = { top: 20, right: 80, bottom: 20, left: 80 }
  const innerWidth = width - margin.left - margin.right
  const innerHeight = height - margin.top - margin.bottom

  const svg = d3.select(container)
    .append('svg')
    .attr('width', width)
    .attr('height', height)

  const g = svg.append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`)

  const maxCount = d3.max(props.data, d => d.count) || 1
  const stageHeight = innerHeight / props.data.length

  const funnelGroup = g.selectAll('.funnel-stage')
    .data(props.data)
    .enter()
    .append('g')
    .attr('class', 'funnel-stage')
    .attr('transform', (_, i) => `translate(0, ${i * stageHeight})`)
    .style('cursor', 'pointer')
    .on('mouseenter', function (event, d) {
      d3.select(this).select('path').attr('opacity', 0.9)
      showTooltip(event, d)
    })
    .on('mousemove', function (event) {
      moveTooltip(event)
    })
    .on('mouseleave', function () {
      d3.select(this).select('path').attr('opacity', 0.7)
      hideTooltip()
    })
    .on('click', function (_, d) {
      emit('stage-click', d)
    })

  funnelGroup.each(function (d, i) {
    const stage = d3.select(this)
    const nextD = props.data[i + 1]
    const topWidth = (d.count / maxCount) * innerWidth
    const bottomWidth = nextD ? (nextD.count / maxCount) * innerWidth : topWidth * 0.6

    const x1 = (innerWidth - topWidth) / 2
    const x2 = (innerWidth - bottomWidth) / 2
    const y1 = 0
    const y2 = stageHeight - 5

    const path = d3.path()
    path.moveTo(x1, y1)
    path.lineTo(x1 + topWidth, y1)
    path.lineTo(x2 + bottomWidth, y2)
    path.lineTo(x2, y2)
    path.closePath()

    stage.append('path')
      .attr('d', path.toString())
      .attr('fill', colors[i % colors.length])
      .attr('opacity', 0.7)
      .attr('stroke', colors[i % colors.length])
      .attr('stroke-width', 2)
      .style('transition', 'opacity 0.2s')

    stage.append('text')
      .attr('x', 10)
      .attr('y', stageHeight / 2 - 8)
      .attr('fill', '#F1F5F9')
      .attr('font-size', '13px')
      .attr('font-weight', '500')
      .text(d.stage)

    stage.append('text')
      .attr('x', 10)
      .attr('y', stageHeight / 2 + 12)
      .attr('fill', '#94A3B8')
      .attr('font-size', '12px')
      .attr('font-family', 'JetBrains Mono, monospace')
      .text(formatNumber(d.count))

    if (i > 0) {
      const convRate = d.conversionRate
      stage.append('text')
        .attr('x', innerWidth - 10)
        .attr('y', stageHeight / 2)
        .attr('text-anchor', 'end')
        .attr('fill', convRate < 0.5 ? '#EF4444' : '#10B981')
        .attr('font-size', '12px')
        .attr('font-weight', '600')
        .text(`转化率 ${formatPercent(convRate, 0)}`)
    }
  })
}

function showTooltip(event: MouseEvent, d: FunnelData) {
  if (!tooltipRef.value) return
  const tooltip = tooltipRef.value
  tooltip.innerHTML = `
    <div class="font-semibold mb-1">${d.stage}</div>
    <div class="text-survey-text-secondary text-sm">
      <div>样本量: <span class="text-survey-text-primary font-mono">${formatNumber(d.count)}</span></div>
      <div>转化率: <span class="text-survey-success">${formatPercent(d.conversionRate)}</span></div>
      <div>流失率: <span class="text-survey-danger">${formatPercent(d.dropRate)}</span></div>
    </div>
  `
  tooltip.style.display = 'block'
  moveTooltip(event)
}

function moveTooltip(event: MouseEvent) {
  if (!tooltipRef.value) return
  const tooltip = tooltipRef.value
  tooltip.style.left = `${event.pageX + 15}px`
  tooltip.style.top = `${event.pageY - 10}px`
}

function hideTooltip() {
  if (!tooltipRef.value) return
  tooltipRef.value.style.display = 'none'
}

onMounted(() => {
  nextTick(() => {
    drawChart()
  })
})

watch(() => props.data, () => {
  nextTick(() => {
    drawChart()
  })
}, { deep: true })
</script>

<template>
  <div class="relative">
    <div ref="containerRef" class="w-full"></div>
    <div
      ref="tooltipRef"
      class="fixed z-50 hidden bg-survey-bg border border-survey-border rounded-lg px-3 py-2 text-sm text-survey-text-primary shadow-xl pointer-events-none animate-fade-in"
      style="min-width: 160px;"
    ></div>
  </div>
</template>
