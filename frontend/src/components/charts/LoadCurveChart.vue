<template>
  <div class="chart-container" ref="containerRef">
    <div class="chart-title">
      <el-icon><TrendCharts /></el-icon>
      <span>训练负荷曲线</span>
      <span class="title-extra" v-if="summary">(总负荷: {{ summary.totalLoad }} | 均强: {{ summary.avgIntensity }}%)</span>
    </div>
    <div class="chart-wrapper" ref="chartRef">
      <div class="loading-overlay" v-if="loading"><el-icon class="is-loading"><Loading /></el-icon></div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, nextTick } from 'vue'
import * as d3 from 'd3'
import { TrendCharts, Loading } from '@element-plus/icons-vue'

const props = defineProps({
  data: { type: Array, default: () => [] },
  anomalies: { type: Array, default: () => [] },
  metric: { type: String, default: 'load' },
  loading: { type: Boolean, default: false }
})

const emit = defineEmits(['pointClick', 'anomalyClick'])

const containerRef = ref(null)
const chartRef = ref(null)
const summary = ref(null)

const metricLabels = {
  load: { name: '训练负荷', unit: 'AU', color: '#409eff' },
  intensity: { name: '训练强度', unit: '%', color: '#67c23a' },
  completionRate: { name: '完成率', unit: '%', color: '#e6a23c' }
}

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
    .domain(props.data.map(d => d.key))
    .range([0, innerWidth])
    .padding(0.3)

  const y = d3.scaleLinear()
    .domain([0, d3.max(props.data, d => d[props.metric]) * 1.15])
    .range([innerHeight, 0])
    .nice()

  const metricInfo = metricLabels[props.metric] || metricLabels.load

  const area = d3.area()
    .x(d => x(d.key))
    .y0(innerHeight)
    .y1(d => y(d[props.metric]))
    .curve(d3.curveMonotoneX)

  const line = d3.line()
    .x(d => x(d.key))
    .y(d => y(d[props.metric]))
    .curve(d3.curveMonotoneX)

  const gradient = svg.append('defs')
    .append('linearGradient')
    .attr('id', 'areaGradient')
    .attr('x1', '0%')
    .attr('y1', '0%')
    .attr('x2', '0%')
    .attr('y2', '100%')

  gradient.append('stop').attr('offset', '0%').attr('stop-color', metricInfo.color).attr('stop-opacity', 0.4)
  gradient.append('stop').attr('offset', '100%').attr('stop-color', metricInfo.color).attr('stop-opacity', 0.05)

  g.append('path')
    .datum(props.data)
    .attr('fill', 'url(#areaGradient)')
    .attr('d', area)

  g.append('path')
    .datum(props.data)
    .attr('fill', 'none')
    .attr('stroke', metricInfo.color)
    .attr('stroke-width', 2.5)
    .attr('d', line)

  const xAxis = g.append('g')
    .attr('transform', `translate(0,${innerHeight})`)
    .call(d3.axisBottom(x))

  xAxis.selectAll('text')
    .attr('transform', 'rotate(-45)')
    .style('text-anchor', 'end')
    .style('font-size', '10px')

  g.append('g')
    .call(d3.axisLeft(y).ticks(6))

  g.selectAll('.data-point')
    .data(props.data)
    .enter()
    .append('circle')
    .attr('class', 'data-point')
    .attr('cx', d => x(d.key))
    .attr('cy', d => y(d[props.metric]))
    .attr('r', 4)
    .attr('fill', metricInfo.color)
    .attr('cursor', 'pointer')
    .on('click', (event, d) => emit('pointClick', d))

  const anomalyKeys = new Set(props.anomalies.map(a => a.key))
  g.selectAll('.anomaly-point')
    .data(props.data.filter(d => anomalyKeys.has(d.key)))
    .enter()
    .append('circle')
    .attr('class', 'anomaly-dot')
    .attr('cx', d => x(d.key))
    .attr('cy', d => y(d[props.metric]))
    .attr('r', 8)
    .attr('fill', 'none')
    .attr('stroke', '#f56c6c')
    .attr('stroke-width', 2)
    .on('click', (event, d) => emit('anomalyClick', d))

  const tooltip = d3.select(container)
    .append('div')
    .attr('class', 'tooltip')
    .style('opacity', 0)

  g.selectAll('.data-point, .anomaly-dot')
    .on('mouseover', function(event, d) {
      d3.select(this).attr('r', d3.select(this).attr('r') * 1.3)
      tooltip.transition().duration(200).style('opacity', .9)
      tooltip.html(`
        <div>日期: ${d.key}</div>
        <div>${metricInfo.name}: ${d[props.metric]} ${metricInfo.unit}</div>
        ${d.intensity ? `<div>强度: ${d.intensity}%</div>` : ''}
        ${d.completionRate ? `<div>完成率: ${d.completionRate}%</div>` : ''}
      `)
      .style('left', (event.offsetX + 10) + 'px')
      .style('top', (event.offsetY - 28) + 'px')
    })
    .on('mouseout', function() {
      d3.select(this).attr('r', d3.select(this).attr('r') / 1.3)
      tooltip.transition().duration(500).style('opacity', 0)
    })

  if (props.data.length > 0) {
    const total = props.data.reduce((s, d) => s + d[props.metric], 0)
    const avgInt = props.data.reduce((s, d) => s + (d.intensity || 0), 0) / props.data.length
    const avgComp = props.data.reduce((s, d) => s + (d.completionRate || 0), 0) / props.data.length
    summary.value = {
      totalLoad: Math.round(total),
      avgIntensity: Math.round(avgInt),
      avgCompletion: Math.round(avgComp)
    }
  }
}

onMounted(renderChart)
watch(() => [props.data, props.metric, props.anomalies], renderChart, { deep: true })
</script>

<style scoped>
.title-extra {
  font-size: 12px;
  color: #909399;
  font-weight: normal;
}
</style>
