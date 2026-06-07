<template>
  <div class="chart-container" ref="containerRef">
    <div class="chart-header">
      <h3 class="chart-title">异常时长分布</h3>
      <div class="summary-stats" v-if="summary.totalDuration">
        <span>总时长: {{ summary.totalDuration }}</span>
        <span>平均时长: {{ summary.avgDuration }}</span>
      </div>
    </div>
    <svg ref="svgRef"></svg>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import * as d3 from 'd3'
import api from '../utils/api'
import { useFilterStore } from '../stores/filter'
import { useDrilldown } from '../composables/useDrilldown'
import { formatDuration } from '../utils/format'

const containerRef = ref(null)
const svgRef = ref(null)
const filterStore = useFilterStore()
const { drillDown } = useDrilldown()

const chartData = ref([])

const summary = computed(() => {
  const total = chartData.value.reduce((s, d) => s + (d.total_duration || 0), 0)
  const count = chartData.value.length
  return {
    totalDuration: formatDuration(total),
    avgDuration: formatDuration(count ? total / count : 0)
  }
})

let resizeObserver = null

async function fetchData() {
  try {
    const params = filterStore.buildQueryParams()
    const res = await api.get('/exceptions/duration', { params })
    chartData.value = res.data || []
  } catch {
    chartData.value = []
  }
}

function drawChart() {
  const container = containerRef.value
  const svgEl = svgRef.value
  if (!container || !svgEl || !chartData.value.length) return

  const width = container.clientWidth
  const barHeight = 32
  const margin = { top: 10, right: 80, bottom: 30, left: 120 }
  const height = Math.max(200, chartData.value.length * barHeight * 3 + margin.top + margin.bottom)
  const innerW = width - margin.left - margin.right
  const innerH = height - margin.top - margin.bottom

  const svg = d3.select(svgEl).attr('width', width).attr('height', height)
  svg.selectAll('*').remove()

  const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`)

  const severities = ['critical', 'major', 'minor']
  const sevColors = { critical: '#ef4444', major: '#f59e0b', minor: '#60a5fa' }

  const stacked = chartData.value.map(d => {
    const parts = severities.map(s => ({
      severity: s,
      duration: (d.severity_breakdown || {})[s] || 0
    }))
    let offset = 0
    parts.forEach(p => { p.offset = offset; offset += p.duration })
    return { ...d, parts, total: offset }
  })

  const xMax = d3.max(stacked, d => d.total) || 60

  const yScale = d3.scaleBand()
    .domain(stacked.map(d => d.exception_type))
    .range([0, innerH])
    .padding(0.3)

  const xScale = d3.scaleLinear()
    .domain([0, xMax])
    .range([0, innerW])

  g.append('g')
    .call(d3.axisBottom(xScale).ticks(6).tickFormat(d => formatDuration(d)))
    .attr('transform', `translate(0,${innerH})`)
    .selectAll('text').attr('fill', '#94a3b8')

  g.append('g')
    .call(d3.axisLeft(yScale))
    .selectAll('text').attr('fill', '#cbd5e1')

  stacked.forEach(item => {
    const group = g.append('g')

    item.parts.forEach(part => {
      group.append('rect')
        .attr('x', xScale(part.offset))
        .attr('y', yScale(item.exception_type))
        .attr('width', Math.max(0, xScale(part.duration)))
        .attr('height', yScale.bandwidth())
        .attr('fill', sevColors[part.severity])
        .attr('rx', 2)
        .attr('cursor', 'pointer')
        .on('click', () => {
          filterStore.exceptionType = item.exception_type
          drillDown('overall', null, '整体趋势')
        })
    })

    group.append('text')
      .attr('x', xScale(item.total) + 6)
      .attr('y', yScale(item.exception_type) + yScale.bandwidth() / 2)
      .attr('dy', '0.35em')
      .attr('fill', '#94a3b8')
      .attr('font-size', 11)
      .text(formatDuration(item.total))
  })

  const legend = g.append('g').attr('transform', `translate(${innerW - 150}, -5)`)
  severities.forEach((s, i) => {
    legend.append('rect').attr('x', i * 55).attr('width', 12).attr('height', 12).attr('fill', sevColors[s]).attr('rx', 2)
    const labels = { critical: '严重', major: '重要', minor: '轻微' }
    legend.append('text').attr('x', i * 55 + 16).attr('y', 10).attr('fill', '#94a3b8').attr('font-size', 11).text(labels[s])
  })
}

watch(() => filterStore.filterParams, () => { fetchData().then(drawChart) }, { deep: true })

onMounted(() => {
  fetchData().then(drawChart)
  resizeObserver = new ResizeObserver(() => drawChart())
  if (containerRef.value) resizeObserver.observe(containerRef.value)
})

onUnmounted(() => {
  if (resizeObserver) resizeObserver.disconnect()
})
</script>
