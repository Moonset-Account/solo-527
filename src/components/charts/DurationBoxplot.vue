<script setup lang="ts">
import { ref, onMounted, watch, nextTick, computed } from 'vue'
import * as d3 from 'd3'
import type { QuestionGroupDuration } from '@/types'
import { formatDuration } from '@/utils/format'

const props = defineProps<{
  data: QuestionGroupDuration[]
}>()

const emit = defineEmits<{
  (e: 'group-click', group: QuestionGroupDuration): void
}>()

const containerRef = ref<HTMLDivElement | null>(null)
const tooltipRef = ref<HTMLDivElement | null>(null)

const allValues = computed(() => {
  const vals: number[] = []
  props.data.forEach(d => {
    vals.push(d.min, d.q1, d.median, d.q3, d.max, ...d.outliers)
  })
  return vals
})

function drawChart() {
  if (!containerRef.value || !props.data?.length) return

  const container = containerRef.value
  d3.select(container).selectAll('*').remove()

  const width = container.clientWidth || 600
  const height = 300
  const margin = { top: 20, right: 30, bottom: 60, left: 60 }
  const innerWidth = width - margin.left - margin.right
  const innerHeight = height - margin.top - margin.bottom

  const svg = d3.select(container)
    .append('svg')
    .attr('width', width)
    .attr('height', height)

  const g = svg.append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`)

  const xScale = d3.scaleBand<string>()
    .domain(props.data.map(d => d.groupName))
    .range([0, innerWidth])
    .padding(0.3)

  const yScale = d3.scaleLinear<number, number>()
    .domain([0, d3.max(allValues.value) || 100])
    .range([innerHeight, 0])
    .nice()

  const xAxis = d3.axisBottom(xScale)
  g.append('g')
    .attr('transform', `translate(0,${innerHeight})`)
    .call(xAxis)
    .selectAll('text')
    .attr('fill', '#94A3B8')
    .attr('font-size', '11px')
    .style('text-anchor', 'end')
    .attr('transform', 'rotate(-20)')

  g.selectAll('.domain, .tick line')
    .attr('stroke', '#475569')

  const yAxis = d3.axisLeft(yScale)
    .ticks(6)
    .tickFormat(d => formatDuration(d as number))

  g.append('g')
    .call(yAxis)
    .selectAll('text')
    .attr('fill', '#94A3B8')
    .attr('font-size', '11px')

  g.append('line')
    .attr('x1', 0)
    .attr('x2', innerWidth)
    .attr('y1', yScale(60))
    .attr('y2', yScale(60))
    .attr('stroke', '#F59E0B')
    .attr('stroke-width', 1)
    .attr('stroke-dasharray', '4,4')
    .attr('opacity', 0.6)

  g.append('text')
    .attr('x', innerWidth)
    .attr('y', yScale(60) - 5)
    .attr('text-anchor', 'end')
    .attr('fill', '#F59E0B')
    .attr('font-size', '10px')
    .text('正常耗时区间参考线')

  const groups = g.selectAll('.box-group')
    .data(props.data)
    .enter()
    .append('g')
    .attr('class', 'box-group')
    .attr('transform', d => `translate(${xScale(d.groupName) || 0}, 0)`)
    .style('cursor', 'pointer')
    .on('mouseenter', function (event, d) {
      d3.select(this).select('.box-rect').attr('opacity', 0.9)
      showTooltip(event, d)
    })
    .on('mousemove', function (event) {
      moveTooltip(event)
    })
    .on('mouseleave', function () {
      d3.select(this).select('.box-rect').attr('opacity', 0.7)
      hideTooltip()
    })
    .on('click', function (_, d) {
      emit('group-click', d)
    })

  groups.each(function (d) {
    const group = d3.select(this)
    const xCenter = xScale.bandwidth() / 2
    const boxWidth = xScale.bandwidth() * 0.6
    const boxLeft = xCenter - boxWidth / 2
    const boxRight = xCenter + boxWidth / 2

    group.append('line')
      .attr('x1', xCenter)
      .attr('x2', xCenter)
      .attr('y1', yScale(d.min))
      .attr('y2', yScale(d.max))
      .attr('stroke', '#06B6D4')
      .attr('stroke-width', 1.5)

    group.append('line')
      .attr('x1', boxLeft)
      .attr('x2', boxRight)
      .attr('y1', yScale(d.min))
      .attr('y2', yScale(d.min))
      .attr('stroke', '#06B6D4')
      .attr('stroke-width', 2)

    group.append('line')
      .attr('x1', boxLeft)
      .attr('x2', boxRight)
      .attr('y1', yScale(d.max))
      .attr('y2', yScale(d.max))
      .attr('stroke', '#06B6D4')
      .attr('stroke-width', 2)

    group.append('rect')
      .attr('class', 'box-rect')
      .attr('x', boxLeft)
      .attr('y', yScale(d.q3))
      .attr('width', boxWidth)
      .attr('height', yScale(d.q1) - yScale(d.q3))
      .attr('fill', '#06B6D4')
      .attr('opacity', 0.7)
      .attr('rx', 2)
      .style('transition', 'opacity 0.2s')

    group.append('line')
      .attr('x1', boxLeft)
      .attr('x2', boxRight)
      .attr('y1', yScale(d.median))
      .attr('y2', yScale(d.median))
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)

    d.outliers.forEach(outlier => {
      group.append('circle')
        .attr('cx', xCenter)
        .attr('cy', yScale(outlier))
        .attr('r', 4)
        .attr('fill', '#EF4444')
        .attr('stroke', '#fff')
        .attr('stroke-width', 1.5)
    })
  })
}

function showTooltip(event: MouseEvent, d: QuestionGroupDuration) {
  if (!tooltipRef.value) return
  const tooltip = tooltipRef.value
  tooltip.innerHTML = `
    <div class="font-semibold mb-2">${d.groupName}</div>
    <div class="space-y-1 text-sm">
      <div class="flex justify-between gap-6">
        <span class="text-survey-text-secondary">最小值</span>
        <span class="text-survey-text-primary font-mono">${formatDuration(d.min)}</span>
      </div>
      <div class="flex justify-between gap-6">
        <span class="text-survey-text-secondary">Q1 (25%)</span>
        <span class="text-survey-text-primary font-mono">${formatDuration(d.q1)}</span>
      </div>
      <div class="flex justify-between gap-6">
        <span class="text-survey-text-secondary">中位数</span>
        <span class="text-survey-primary font-mono font-semibold">${formatDuration(d.median)}</span>
      </div>
      <div class="flex justify-between gap-6">
        <span class="text-survey-text-secondary">Q3 (75%)</span>
        <span class="text-survey-text-primary font-mono">${formatDuration(d.q3)}</span>
      </div>
      <div class="flex justify-between gap-6">
        <span class="text-survey-text-secondary">最大值</span>
        <span class="text-survey-text-primary font-mono">${formatDuration(d.max)}</span>
      </div>
      <div class="flex justify-between gap-6 pt-1 border-t border-survey-border">
        <span class="text-survey-text-secondary">离群值</span>
        <span class="text-survey-danger font-mono">${d.outliers.length} 个</span>
      </div>
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
      class="fixed z-50 hidden bg-survey-bg border border-survey-border rounded-lg px-4 py-3 text-sm text-survey-text-primary shadow-xl pointer-events-none animate-fade-in"
      style="min-width: 200px;"
    ></div>
  </div>
</template>
