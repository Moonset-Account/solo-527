<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from 'vue'
import * as d3 from 'd3'
import { mockTimeOfUsePrices } from '@/mock'

interface BarData {
  hour: number
  value: number
}

interface Props {
  data: BarData[]
  height?: number
  title?: string
}

const props = withDefaults(defineProps<Props>(), {
  height: 300,
  title: ''
})

const chartRef = ref<HTMLDivElement | null>(null)

function getPeriodColor(hour: number): string {
  const period = mockTimeOfUsePrices.find(p => {
    const start = parseInt(p.startTime.split(':')[0])
    const end = parseInt(p.endTime.split(':')[0])
    return hour >= start && hour < end
  })

  const colorMap: Record<string, string> = {
    critical: '#EF4444',
    peak: '#F59E0B',
    flat: '#3B82F6',
    valley: '#10B981'
  }

  return colorMap[period?.period || 'flat']
}

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

  const innerWidth = width - margin.left - margin.right
  const innerHeight = height - margin.top - margin.bottom

  const g = svg.append('g')
    .attr('transform', `translate(${margin.left}, ${margin.top})`)

  const xScale = d3.scaleBand<number>()
    .domain(props.data.map(d => d.hour))
    .range([0, innerWidth])
    .padding(0.2)

  const maxValue = d3.max(props.data, d => d.value) || 100
  const yScale = d3.scaleLinear()
    .domain([0, maxValue * 1.1])
    .range([innerHeight, 0])

  const xAxis = d3.axisBottom(xScale)
    .tickFormat(d => `${d}时`)
    .tickValues(xScale.domain().filter((_, i) => i % 2 === 0))

  const yAxis = d3.axisLeft(yScale)
    .ticks(5)

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

  const bars = g.selectAll('.bar')
    .data(props.data)
    .enter()
    .append('rect')
    .attr('class', 'bar')
    .attr('x', d => xScale(d.hour)!)
    .attr('y', innerHeight)
    .attr('width', xScale.bandwidth())
    .attr('height', 0)
    .attr('fill', d => getPeriodColor(d.hour))
    .attr('rx', 3)
    .style('cursor', 'pointer')

  bars.transition()
    .duration(800)
    .delay((_, i) => i * 20)
    .attr('y', d => yScale(d.value))
    .attr('height', d => innerHeight - yScale(d.value))

  bars.on('mouseover', function(event, d) {
    d3.select(this)
      .transition()
      .duration(150)
      .attr('opacity', 0.8)
  })
  .on('mouseout', function() {
    d3.select(this)
      .transition()
      .duration(150)
      .attr('opacity', 1)
  })

  const legend = g.append('g')
    .attr('transform', `translate(${innerWidth - 180}, 0)`)

  const legendItems = [
    { label: '尖峰', color: '#EF4444' },
    { label: '峰', color: '#F59E0B' },
    { label: '平', color: '#3B82F6' },
    { label: '谷', color: '#10B981' }
  ]

  legendItems.forEach((item, i) => {
    const row = legend.append('g')
      .attr('transform', `translate(${i * 45}, 0)`)

    row.append('rect')
      .attr('width', 12)
      .attr('height', 12)
      .attr('rx', 2)
      .attr('fill', item.color)

    row.append('text')
      .attr('x', 16)
      .attr('y', 10)
      .attr('fill', '#94A3B8')
      .attr('font-size', '11px')
      .text(item.label)
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
