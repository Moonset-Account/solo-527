<template>
  <div class="chart-container" ref="containerRef">
    <div class="chart-header">
      <h3 class="chart-title">责任分段</h3>
    </div>
    <svg ref="svgRef"></svg>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as d3 from 'd3'
import api from '../utils/api'
import { formatDuration, formatDatetime } from '../utils/format'

const props = defineProps({ routeId: { type: String, default: '' } })

const containerRef = ref(null)
const svgRef = ref(null)
const chartData = ref([])

let resizeObserver = null

async function fetchData() {
  try {
    const url = props.routeId ? `/routes/${props.routeId}/responsibility` : '/exceptions/responsibility'
    const res = await api.get(url)
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
  const rowHeight = 36
  const margin = { top: 20, right: 40, bottom: 30, left: 100 }
  const height = Math.max(160, chartData.value.length * rowHeight + margin.top + margin.bottom)
  const innerW = width - margin.left - margin.right
  const innerH = height - margin.top - margin.bottom

  const svg = d3.select(svgEl).attr('width', width).attr('height', height)
  svg.selectAll('*').remove()

  const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`)

  const allTimes = []
  chartData.value.forEach(d => {
    allTimes.push(new Date(d.start_time))
    allTimes.push(new Date(d.end_time))
  })

  const xScale = d3.scaleTime()
    .domain(d3.extent(allTimes))
    .range([0, innerW])

  const segments = ['driver', 'warehouse', 'transfer']
  const segColors = { driver: '#60a5fa', warehouse: '#f59e0b', transfer: '#a78bfa' }
  const segLabels = { driver: '司机', warehouse: '仓库', transfer: '转运' }

  const yScale = d3.scaleBand()
    .domain(chartData.value.map(d => d.exception_id || d.id))
    .range([0, innerH])
    .padding(0.25)

  g.append('g')
    .attr('transform', `translate(0,${innerH})`)
    .call(d3.axisBottom(xScale).ticks(6).tickFormat(d3.timeFormat('%m/%d %H:%M')))
    .selectAll('text').attr('fill', '#94a3b8').attr('transform', 'rotate(-25)').style('text-anchor', 'end')

  g.append('g')
    .call(d3.axisLeft(yScale))
    .selectAll('text').attr('fill', '#cbd5e1')

  chartData.value.forEach(item => {
    const y = yScale(item.exception_id || item.id)
    const barH = yScale.bandwidth()

    segments.forEach(seg => {
      const segData = item.segments?.[seg]
      if (!segData) return

      const x1 = xScale(new Date(segData.start_time || item.start_time))
      const x2 = xScale(new Date(segData.end_time || item.end_time))

      g.append('rect')
        .attr('x', x1)
        .attr('y', y + (segments.indexOf(seg) / segments.length) * barH)
        .attr('width', Math.max(0, x2 - x1))
        .attr('height', barH / segments.length)
        .attr('fill', segColors[seg])
        .attr('rx', 2)
        .attr('cursor', 'pointer')
        .on('mouseenter', function () {
          d3.select(this).attr('opacity', 0.8)
        })
        .on('mouseleave', function () {
          d3.select(this).attr('opacity', 1)
        })
        .append('title')
        .text(`${segLabels[seg]} - ${formatDatetime(segData.start_time)} 至 ${formatDatetime(segData.end_time)}`)
    })
  })

  const legend = g.append('g').attr('transform', `translate(${innerW - 200}, -10)`)
  segments.forEach((seg, i) => {
    legend.append('rect').attr('x', i * 70).attr('width', 12).attr('height', 12).attr('fill', segColors[seg]).attr('rx', 2)
    legend.append('text').attr('x', i * 70 + 16).attr('y', 10).attr('fill', '#94a3b8').attr('font-size', 11).text(segLabels[seg])
  })
}

watch(() => props.routeId, () => { fetchData().then(drawChart) })

onMounted(() => {
  fetchData().then(drawChart)
  resizeObserver = new ResizeObserver(() => drawChart())
  if (containerRef.value) resizeObserver.observe(containerRef.value)
})

onUnmounted(() => {
  if (resizeObserver) resizeObserver.disconnect()
})
</script>
