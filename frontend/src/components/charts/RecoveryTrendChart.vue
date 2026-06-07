<template>
  <div class="chart-container">
    <div class="chart-title">
      <el-icon><MoonNight /></el-icon>
      <span>恢复趋势</span>
      <span class="title-extra" v-if="summary">(均分: {{ summary.avgOverall }} | HRV: {{ summary.avgHRV }})</span>
    </div>
    <div class="chart-wrapper" ref="chartRef">
      <div class="loading-overlay" v-if="loading"><el-icon class="is-loading"><Loading /></el-icon></div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, nextTick } from 'vue'
import * as d3 from 'd3'
import { MoonNight, Loading } from '@element-plus/icons-vue'

const props = defineProps({
  data: { type: Array, default: () => [] },
  anomalies: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false }
})

const emit = defineEmits(['pointClick'])

const chartRef = ref(null)
const summary = ref(null)

const renderChart = async () => {
  if (!chartRef.value || !props.data.length) return

  await nextTick()
  const container = chartRef.value
  container.innerHTML = ''

  const width = container.clientWidth
  const height = container.clientHeight
  const margin = { top: 20, right: 30, bottom: 50, left: 60 }
  const innerWidth = width - margin.left - margin.right
  const innerHeight = height - margin.top - margin.bottom

  const svg = d3.select(container)
    .append('svg')
    .attr('width', width)
    .attr('height', height)

  const g = svg.append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`)

  const x = d3.scalePoint()
    .domain(props.data.map(d => d.date))
    .range([0, innerWidth])
    .padding(0.3)

  const y = d3.scaleLinear()
    .domain([0, 100])
    .range([innerHeight, 0])

  const metrics = [
    { key: 'overallScore', name: '综合', color: '#409eff', width: 2.5 },
    { key: 'sleepScore', name: '睡眠', color: '#67c23a', width: 1.5 },
    { key: 'fatigueScore', name: '疲劳', color: '#e6a23c', width: 1.5 },
    { key: 'sorenessScore', name: '酸痛', color: '#f56c6c', width: 1.5 }
  ]

  metrics.forEach(metric => {
    const line = d3.line()
      .x(d => x(d.date))
      .y(d => y(d[metric.key]))
      .curve(d3.curveMonotoneX)

    g.append('path')
      .datum(props.data)
      .attr('fill', 'none')
      .attr('stroke', metric.color)
      .attr('stroke-width', metric.width)
      .attr('d', line)
  })

  const xAxis = g.append('g')
    .attr('transform', `translate(0,${innerHeight})`)
    .call(d3.axisBottom(x))

  xAxis.selectAll('text')
    .attr('transform', 'rotate(-45)')
    .style('text-anchor', 'end')
    .style('font-size', '10px')

  g.append('g')
    .call(d3.axisLeft(y).ticks(5))

  const anomalyKeys = new Set(props.anomalies.map(a => a.date))
  g.selectAll('.anomaly-point')
    .data(props.data.filter(d => anomalyKeys.has(d.date)))
    .enter()
    .append('circle')
    .attr('cx', d => x(d.date))
    .attr('cy', d => y(d.overallScore))
    .attr('r', 8)
    .attr('fill', 'none')
    .attr('stroke', '#f56c6c')
    .attr('stroke-width', 2)
    .attr('cursor', 'pointer')
    .on('click', (event, d) => emit('pointClick', d))

  const legend = svg.append('g').attr('transform', `translate(${width - 150}, 15)`)
  metrics.forEach((m, i) => {
    legend.append('line')
      .attr('x1', 0).attr('x2', 20)
      .attr('y1', i * 18 + 8).attr('y2', i * 18 + 8)
      .attr('stroke', m.color).attr('stroke-width', m.width)
    legend.append('text')
      .attr('x', 28).attr('y', i * 18 + 12)
      .style('font-size', '11px').style('fill', '#606266')
      .text(m.name)
  })

  const tooltip = d3.select(container)
    .append('div')
    .attr('class', 'tooltip')
    .style('opacity', 0)

  g.selectAll('path')
    .style('pointer-events', 'none')

  svg.on('mousemove', function(event) {
    const [mx] = d3.pointer(event)
    const xPos = mx - margin.left
    if (xPos < 0 || xPos > innerWidth) return

    const allDates = props.data.map(d => d.date)
    const bisect = d3.bisector(d => x(d)).left
    const idx = Math.min(bisect(xPos), allDates.length - 1)
    const d = props.data[idx]

    if (d) {
      tooltip.style('opacity', .9)
      tooltip.html(`
        <div>日期: ${d.date}</div>
        <div>综合: ${d.overallScore}</div>
        <div>睡眠: ${d.sleepScore}</div>
        <div>疲劳: ${d.fatigueScore}</div>
        <div>HRV: ${d.hrv}</div>
      `)
      .style('left', (event.offsetX + 10) + 'px')
      .style('top', (event.offsetY - 60) + 'px')
    }
  }).on('mouseout', () => tooltip.style('opacity', 0))

  if (props.data.length > 0) {
    summary.value = {
      avgOverall: Math.round(props.data.reduce((s, d) => s + d.overallScore, 0) / props.data.length),
      avgSleep: Math.round(props.data.reduce((s, d) => s + d.sleepScore, 0) / props.data.length),
      avgHRV: Math.round(props.data.reduce((s, d) => s + d.hrv, 0) / props.data.length)
    }
  }
}

onMounted(renderChart)
watch(() => [props.data, props.anomalies], renderChart, { deep: true })
</script>

<style scoped>
.title-extra {
  font-size: 12px;
  color: #909399;
  font-weight: normal;
}
</style>
