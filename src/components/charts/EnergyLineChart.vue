<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from 'vue'
import * as d3 from 'd3'
import type { ChartDataPoint } from '@/types'

interface Props {
  data: ChartDataPoint[]
  height?: number
  color?: string
  showArea?: boolean
  title?: string
}

const props = withDefaults(defineProps<Props>(), {
  height: 300,
  color: '#3B82F6',
  showArea: true,
  title: ''
})

const chartRef = ref<HTMLDivElement | null>(null)

function renderChart() {
  if (!chartRef.value || props.data.length === 0) return

  const container = chartRef.value
  const width = container.clientWidth
  const height = props.height
  const margin = { top: 20, right: 20, bottom: 40, left: 50 }

  d3.select(container).selectAll('svg').remove()

  const svg = d3.select(container)
    .append('svg')
    .attr('width', width)
    .attr('height', height)
    .attr('viewBox', `0 0 ${width} ${height}`)
    .style('overflow', 'visible')

  const innerWidth = width - margin.left - margin.right
  const innerHeight = height - margin.top - margin.bottom

  const g = svg.append('g')
    .attr('transform', `translate(${margin.left}, ${margin.top})`)

  const xScale = d3.scaleBand<string>()
    .domain(props.data.map(d => d.label))
    .range([0, innerWidth])
    .padding(0.1)

  const maxValue = d3.max(props.data, d => d.value) || 100
  const yScale = d3.scaleLinear()
    .domain([0, maxValue * 1.1])
    .range([innerHeight, 0])

  const xAxis = d3.axisBottom(xScale)
    .tickValues(xScale.domain().filter((_, i) => i % Math.ceil(props.data.length / 8) === 0))

  const yAxis = d3.axisLeft(yScale)
    .ticks(5)
    .tickFormat(d => `${d}`)

  g.append('g')
    .attr('transform', `translate(0, ${innerHeight})`)
    .call(xAxis)
    .selectAll('text')
    .attr('fill', '#94A3B8')
    .attr('font-size', '11px')

  g.selectAll('.domain, .tick line')
    .attr('stroke', '#475569')

  g.append('g')
    .call(yAxis)
    .selectAll('text')
    .attr('fill', '#94A3B8')
    .attr('font-size', '11px')

  g.selectAll('.domain')
    .attr('stroke', '#475569')

  g.selectAll('.tick line')
    .attr('stroke', '#334155')
    .attr('stroke-dasharray', '3,3')

  const gridLines = g.append('g')
    .attr('class', 'grid')

  yScale.ticks(5).forEach(tick => {
    gridLines.append('line')
      .attr('x1', 0)
      .attr('x2', innerWidth)
      .attr('y1', yScale(tick))
      .attr('y2', yScale(tick))
      .attr('stroke', '#334155')
      .attr('stroke-dasharray', '3,3')
      .attr('opacity', 0.5)
  })

  if (props.showArea) {
    const areaGenerator = d3.area<ChartDataPoint>()
      .x(d => xScale(d.label)! + xScale.bandwidth() / 2)
      .y0(innerHeight)
      .y1(d => yScale(d.value))
      .defined(d => !d.isOffline)

    const validData = props.data.filter(d => !d.isOffline)
    if (validData.length > 0) {
      g.append('path')
        .datum(validData)
        .attr('fill', props.color)
        .attr('opacity', 0.15)
        .attr('d', areaGenerator)
    }
  }

  const lineGenerator = d3.line<ChartDataPoint>()
    .x(d => xScale(d.label)! + xScale.bandwidth() / 2)
    .y(d => yScale(d.value))
    .defined(d => !d.isOffline)

  const segments: ChartDataPoint[][] = []
  let currentSegment: ChartDataPoint[] = []

  props.data.forEach(d => {
    if (!d.isOffline) {
      currentSegment.push(d)
    } else if (currentSegment.length > 0) {
      segments.push(currentSegment)
      currentSegment = []
    }
  })
  if (currentSegment.length > 0) {
    segments.push(currentSegment)
  }

  segments.forEach(segment => {
    if (segment.length > 1) {
      g.append('path')
        .datum(segment)
        .attr('fill', 'none')
        .attr('stroke', props.color)
        .attr('stroke-width', 2)
        .attr('d', lineGenerator)
    }
  })

  const offlineData = props.data.filter(d => d.isOffline)
  if (offlineData.length > 0) {
    offlineData.forEach(d => {
      g.append('rect')
        .attr('x', xScale(d.label)!)
        .attr('y', 0)
        .attr('width', xScale.bandwidth())
        .attr('height', innerHeight)
        .attr('fill', '#EF4444')
        .attr('opacity', 0.1)
    })

    const offlineAnnotation = g.append('g')
      .attr('transform', `translate(${innerWidth - 100}, 10)`)

    offlineAnnotation.append('rect')
      .attr('width', 90)
      .attr('height', 24)
      .attr('rx', 4)
      .attr('fill', '#EF4444')
      .attr('opacity', 0.2)

    offlineAnnotation.append('text')
      .attr('x', 45)
      .attr('y', 16)
      .attr('text-anchor', 'middle')
      .attr('fill', '#EF4444')
      .attr('font-size', '11px')
      .text('设备离线时段')
  }

  props.data.forEach(d => {
    if (!d.isOffline) {
      g.append('circle')
        .attr('cx', xScale(d.label)! + xScale.bandwidth() / 2)
        .attr('cy', yScale(d.value))
        .attr('r', 3)
        .attr('fill', props.color)
        .attr('opacity', 0.8)
    }
  })

  const tooltip = d3.select('body')
    .append('div')
    .attr('class', 'd3-tooltip')
    .style('position', 'absolute')
    .style('background', '#1E293B')
    .style('border', '1px solid #475569')
    .style('border-radius', '8px')
    .style('padding', '8px 12px')
    .style('font-size', '12px')
    .style('color', '#E2E8F0')
    .style('pointer-events', 'none')
    .style('opacity', 0)
    .style('z-index', 1000)

  g.selectAll('.data-point')
    .data(props.data.filter(d => !d.isOffline))
    .enter()
    .append('circle')
    .attr('class', 'data-point')
    .attr('cx', d => xScale(d.label)! + xScale.bandwidth() / 2)
    .attr('cy', d => yScale(d.value))
    .attr('r', 6)
    .attr('fill', 'transparent')
    .style('cursor', 'pointer')
    .on('mouseover', function(event, d) {
      d3.select(this).attr('r', 8).attr('fill', props.color).attr('opacity', 0.3)
      tooltip
        .style('opacity', 1)
        .html(`
          <div style="font-weight: 600; margin-bottom: 4px;">${d.label}</div>
          <div>能耗: <span style="color: ${props.color}; font-weight: 600;">${d.value.toFixed(2)} kWh</span></div>
        `)
    })
    .on('mousemove', function(event) {
      tooltip
        .style('left', (event.pageX + 10) + 'px')
        .style('top', (event.pageY - 10) + 'px')
    })
    .on('mouseout', function() {
      d3.select(this).attr('r', 6).attr('fill', 'transparent')
      tooltip.style('opacity', 0)
    })
}

onMounted(() => {
  nextTick(() => {
    renderChart()
  })
})

watch(() => props.data, () => {
  nextTick(() => {
    renderChart()
  })
}, { deep: true })

let resizeObserver: ResizeObserver | null = null

onMounted(() => {
  if (chartRef.value) {
    resizeObserver = new ResizeObserver(() => {
      renderChart()
    })
    resizeObserver.observe(chartRef.value)
  }
})
</script>

<template>
  <div class="w-full">
    <div v-if="title" class="mb-3">
      <h3 class="text-sm font-medium text-slate-300">{{ title }}</h3>
    </div>
    <div ref="chartRef" class="w-full"></div>
  </div>
</template>
