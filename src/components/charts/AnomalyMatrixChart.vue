<script setup lang="ts">
import { ref, onMounted, watch, nextTick, computed } from 'vue'
import * as d3 from 'd3'
import type { AnomalyMatrixCell } from '@/types'
import { formatNumber, formatPercent } from '@/utils/format'
import { ANOMALY_LEVEL_COLORS } from '@/utils/constants'

const props = defineProps<{
  data: AnomalyMatrixCell[]
}>()

const emit = defineEmits<{
  (e: 'cell-click', cell: AnomalyMatrixCell): void
}>()

const containerRef = ref<HTMLDivElement | null>(null)
const tooltipRef = ref<HTMLDivElement | null>(null)

const channels = computed(() => {
  return [...new Set(props.data.map(d => d.channelName))]
})

const anomalyTypes = computed(() => {
  return [...new Set(props.data.map(d => d.anomalyTypeName))]
})

const colorScale = computed(() => {
  return d3.scaleLinear<string>()
    .domain([0, 0.02, 0.05, 0.08])
    .range(['#1E3A5F', '#2563EB', '#F59E0B', '#EF4444'])
})

function drawChart() {
  if (!containerRef.value || !props.data?.length) return

  const container = containerRef.value
  d3.select(container).selectAll('*').remove()

  const width = container.clientWidth || 800
  const height = 400
  const margin = { top: 50, right: 30, bottom: 30, left: 120 }
  const innerWidth = width - margin.left - margin.right
  const innerHeight = height - margin.top - margin.bottom

  const svg = d3.select(container)
    .append('svg')
    .attr('width', width)
    .attr('height', height)

  const g = svg.append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`)

  const xScale = d3.scaleBand<string>()
    .domain(anomalyTypes.value)
    .range([0, innerWidth])
    .padding(0.05)

  const yScale = d3.scaleBand<string>()
    .domain(channels.value)
    .range([0, innerHeight])
    .padding(0.05)

  g.append('g')
    .attr('class', 'x-axis')
    .call(d3.axisTop(xScale))
    .selectAll('text')
    .attr('fill', '#94A3B8')
    .attr('font-size', '11px')
    .style('text-anchor', 'middle')

  g.selectAll('.x-axis path, .x-axis line')
    .attr('stroke', '#475569')

  g.append('g')
    .attr('class', 'y-axis')
    .call(d3.axisLeft(yScale))
    .selectAll('text')
    .attr('fill', '#94A3B8')
    .attr('font-size', '12px')

  g.selectAll('.y-axis path, .y-axis line')
    .attr('stroke', '#475569')

  const cells = g.selectAll('.matrix-cell')
    .data(props.data)
    .enter()
    .append('rect')
    .attr('class', 'matrix-cell')
    .attr('x', d => xScale(d.anomalyTypeName) || 0)
    .attr('y', d => yScale(d.channelName) || 0)
    .attr('width', xScale.bandwidth())
    .attr('height', yScale.bandwidth())
    .attr('rx', 3)
    .attr('fill', d => colorScale.value(d.rate))
    .attr('stroke', 'transparent')
    .attr('stroke-width', 2)
    .style('cursor', 'pointer')
    .style('transition', 'all 0.15s ease')
    .on('mouseenter', function (event, d) {
      d3.select(this)
        .attr('stroke', '#F1F5F9')
        .attr('transform', 'scale(1.02)')
        .attr('transform-origin', `${(xScale(d.anomalyTypeName) || 0) + xScale.bandwidth() / 2} ${(yScale(d.channelName) || 0) + yScale.bandwidth() / 2}`)
      showTooltip(event, d)
    })
    .on('mousemove', function (event) {
      moveTooltip(event)
    })
    .on('mouseleave', function () {
      d3.select(this)
        .attr('stroke', 'transparent')
        .attr('transform', 'scale(1)')
      hideTooltip()
    })
    .on('click', function (_, d) {
      emit('cell-click', d)
    })

  g.selectAll('.cell-label')
    .data(props.data)
    .enter()
    .append('text')
    .attr('class', 'cell-label')
    .attr('x', d => (xScale(d.anomalyTypeName) || 0) + xScale.bandwidth() / 2)
    .attr('y', d => (yScale(d.channelName) || 0) + yScale.bandwidth() / 2 + 4)
    .attr('text-anchor', 'middle')
    .attr('fill', '#F1F5F9')
    .attr('font-size', '11px')
    .attr('font-family', 'JetBrains Mono, monospace')
    .attr('pointer-events', 'none')
    .text(d => formatNumber(d.count))
}

function showTooltip(event: MouseEvent, d: AnomalyMatrixCell) {
  if (!tooltipRef.value) return
  const tooltip = tooltipRef.value
  tooltip.innerHTML = `
    <div class="font-semibold mb-2">${d.channelName}</div>
    <div class="space-y-1 text-sm">
      <div class="flex justify-between gap-4">
        <span class="text-survey-text-secondary">异常类型</span>
        <span class="text-survey-text-primary">${d.anomalyTypeName}</span>
      </div>
      <div class="flex justify-between gap-4">
        <span class="text-survey-text-secondary">异常数量</span>
        <span class="text-survey-text-primary font-mono">${formatNumber(d.count)}</span>
      </div>
      <div class="flex justify-between gap-4">
        <span class="text-survey-text-secondary">异常占比</span>
        <span class="font-mono" style="color: ${ANOMALY_LEVEL_COLORS[d.level]}">${formatPercent(d.rate)}</span>
      </div>
      <div class="flex justify-between gap-4">
        <span class="text-survey-text-secondary">风险等级</span>
        <span style="color: ${ANOMALY_LEVEL_COLORS[d.level]}">${d.level === 'critical' ? '极高' : d.level === 'high' ? '高' : d.level === 'medium' ? '中' : '低'}</span>
      </div>
    </div>
    <div class="mt-2 text-xs text-survey-text-muted">点击下钻查看明细</div>
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
      class="fixed z-50 hidden bg-survey-bg border border-survey-border rounded-lg px-4 py-3 text-sm text-survey-text-primary shadow-xl pointer-events-none animate-fade-in"
      style="min-width: 220px;"
    ></div>
  </div>
</template>
