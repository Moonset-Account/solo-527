<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from 'vue'
import * as d3 from 'd3'
import type { TrendDataPoint } from '@/types'
import { formatNumber, formatPercent, formatDate } from '@/utils/format'

const props = defineProps<{
  data: TrendDataPoint[]
}>()

const containerRef = ref<HTMLDivElement | null>(null)
const tooltipRef = ref<HTMLDivElement | null>(null)

function drawChart() {
  if (!containerRef.value || !props.data?.length) return

  const container = containerRef.value
  d3.select(container).selectAll('*').remove()

  const width = container.clientWidth || 600
  const height = 280
  const margin = { top: 20, right: 60, bottom: 40, left: 50 }
  const innerWidth = width - margin.left - margin.right
  const innerHeight = height - margin.top - margin.bottom

  const svg = d3.select(container)
    .append('svg')
    .attr('width', width)
    .attr('height', height)

  const g = svg.append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`)

  const parseDate = d3.timeParse('%Y-%m-%d')
  const xScale = d3.scaleTime<number, number>()
    .domain(d3.extent(props.data, d => parseDate(d.date) as Date) as [Date, Date])
    .range([0, innerWidth])

  const yCountScale = d3.scaleLinear<number, number>()
    .domain([0, d3.max(props.data, d => d.anomalyCount) || 100])
    .range([innerHeight, 0])
    .nice()

  const yRateScale = d3.scaleLinear<number, number>()
    .domain([0, d3.max(props.data, d => d.anomalyRate) || 0.2])
    .range([innerHeight, 0])
    .nice()

  const area = d3.area<TrendDataPoint>()
    .x(d => xScale(parseDate(d.date) as Date))
    .y0(innerHeight)
    .y1(d => yCountScale(d.anomalyCount))
    .curve(d3.curveMonotoneX)

  const line = d3.line<TrendDataPoint>()
    .x(d => xScale(parseDate(d.date) as Date))
    .y(d => yRateScale(d.anomalyRate))
    .curve(d3.curveMonotoneX)

  const defs = svg.append('defs')
  const gradient = defs.append('linearGradient')
    .attr('id', 'area-gradient')
    .attr('x1', '0%')
    .attr('y1', '0%')
    .attr('x2', '0%')
    .attr('y2', '100%')
  gradient.append('stop').attr('offset', '0%').attr('stop-color', '#06B6D4').attr('stop-opacity', 0.4)
  gradient.append('stop').attr('offset', '100%').attr('stop-color', '#06B6D4').attr('stop-opacity', 0.05)

  g.append('path')
    .datum(props.data)
    .attr('fill', 'url(#area-gradient)')
    .attr('d', area)

  g.append('path')
    .datum(props.data)
    .attr('fill', 'none')
    .attr('stroke', '#EF4444')
    .attr('stroke-width', 2)
    .attr('d', line)

  const xAxis = d3.axisBottom(xScale)
    .ticks(6)
    .tickFormat(d => formatDate(d as Date, 'MM-DD'))

  g.append('g')
    .attr('transform', `translate(0,${innerHeight})`)
    .call(xAxis)
    .selectAll('text')
    .attr('fill', '#94A3B8')
    .attr('font-size', '11px')

  g.selectAll('.domain, .tick line')
    .attr('stroke', '#475569')

  const yLeftAxis = d3.axisLeft(yCountScale)
    .ticks(5)
    .tickFormat(d => formatNumber(d as number))

  g.append('g')
    .call(yLeftAxis)
    .selectAll('text')
    .attr('fill', '#94A3B8')
    .attr('font-size', '11px')

  g.append('text')
    .attr('transform', 'rotate(-90)')
    .attr('x', -innerHeight / 2)
    .attr('y', -38)
    .attr('text-anchor', 'middle')
    .attr('fill', '#94A3B8')
    .attr('font-size', '11px')
    .text('异常样本数')

  const yRightAxis = d3.axisRight(yRateScale)
    .ticks(5)
    .tickFormat(d => formatPercent(d as number, 0))

  g.append('g')
    .attr('transform', `translate(${innerWidth},0)`)
    .call(yRightAxis)
    .selectAll('text')
    .attr('fill', '#EF4444')
    .attr('font-size', '11px')

  g.append('text')
    .attr('transform', 'rotate(90)')
    .attr('x', innerHeight / 2)
    .attr('y', -innerWidth - 40)
    .attr('text-anchor', 'middle')
    .attr('fill', '#EF4444')
    .attr('font-size', '11px')
    .text('异常率')

  const bisect = d3.bisector((d: TrendDataPoint) => parseDate(d.date)).center
  const focus = g.append('g').style('display', 'none')

  focus.append('line')
    .attr('class', 'hover-line')
    .attr('y1', 0)
    .attr('y2', innerHeight)
    .attr('stroke', '#475569')
    .attr('stroke-width', 1)
    .attr('stroke-dasharray', '3,3')

  focus.append('circle')
    .attr('r', 5)
    .attr('fill', '#06B6D4')
    .attr('stroke', '#fff')
    .attr('stroke-width', 2)

  focus.append('circle')
    .attr('r', 5)
    .attr('fill', '#EF4444')
    .attr('stroke', '#fff')
    .attr('stroke-width', 2)
    .attr('class', 'rate-dot')

  svg.append('rect')
    .attr('class', 'overlay')
    .attr('x', margin.left)
    .attr('y', margin.top)
    .attr('width', innerWidth)
    .attr('height', innerHeight)
    .attr('fill', 'none')
    .attr('pointer-events', 'all')
    .on('mouseover', () => {
      focus.style('display', null)
      if (tooltipRef.value) tooltipRef.value.style.display = 'block'
    })
    .on('mouseout', () => {
      focus.style('display', 'none')
      if (tooltipRef.value) tooltipRef.value.style.display = 'none'
    })
    .on('mousemove', function (event) {
      const [mx] = d3.pointer(event)
      const x0 = xScale.invert(mx)
      const i = bisect(props.data, x0 as unknown as Date)
      const d0 = props.data[i]
      if (d0) {
        const xPos = xScale(parseDate(d0.date) as Date)
        focus.select('.hover-line').attr('x1', xPos).attr('x2', xPos)
        focus.select('circle').attr('cx', xPos).attr('cy', yCountScale(d0.anomalyCount))
        focus.select('.rate-dot').attr('cx', xPos).attr('cy', yRateScale(d0.anomalyRate))
        showTooltip(event, d0)
      }
    })
}

function showTooltip(event: MouseEvent, d: TrendDataPoint) {
  if (!tooltipRef.value) return
  const tooltip = tooltipRef.value
  tooltip.innerHTML = `
    <div class="font-semibold mb-2">${d.date}</div>
    <div class="space-y-1 text-sm">
      <div class="flex items-center gap-2">
        <span class="w-2 h-2 rounded-full bg-survey-primary"></span>
        <span class="text-survey-text-secondary">异常样本数</span>
        <span class="text-survey-text-primary font-mono ml-auto">${formatNumber(d.anomalyCount)}</span>
      </div>
      <div class="flex items-center gap-2">
        <span class="w-2 h-2 rounded-full bg-survey-danger"></span>
        <span class="text-survey-text-secondary">异常率</span>
        <span class="text-survey-danger font-mono ml-auto">${formatPercent(d.anomalyRate)}</span>
      </div>
      <div class="pt-1 mt-1 border-t border-survey-border">
        <span class="text-survey-text-secondary">总样本量: </span>
        <span class="text-survey-text-primary font-mono">${formatNumber(d.totalSamples)}</span>
      </div>
    </div>
  `
  tooltip.style.display = 'block'
  tooltip.style.left = `${event.pageX + 15}px`
  tooltip.style.top = `${event.pageY - 10}px`
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
      style="min-width: 200px;"
    ></div>
  </div>
</template>
