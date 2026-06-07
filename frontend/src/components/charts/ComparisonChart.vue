<template>
  <div class="chart-container">
    <div class="chart-title">
      <el-icon><Rank /></el-icon>
      <span>队员训练对比</span>
      <span class="title-extra">({{ metricLabel }})</span>
    </div>
    <div class="chart-wrapper" ref="chartRef">
      <div class="loading-overlay" v-if="loading"><el-icon class="is-loading"><Loading /></el-icon></div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, nextTick, computed } from 'vue'
import * as d3 from 'd3'
import { Rank, Loading } from '@element-plus/icons-vue'

const props = defineProps({
  data: { type: Array, default: () => [] },
  metric: { type: String, default: 'load' },
  loading: { type: Boolean, default: false }
})

const emit = defineEmits(['pointClick'])

const chartRef = ref(null)

const metricLabels = {
  load: { name: '训练负荷', unit: 'AU' },
  intensity: { name: '训练强度', unit: '%' },
  completionRate: { name: '完成率', unit: '%' }
}

const metricLabel = computed(() => metricLabels[props.metric]?.name || '')

const colors = ['#409eff', '#67c23a', '#e6a23c', '#f56c6c', '#909399', '#8e44ad']

const renderChart = async () => {
  if (!chartRef.value || !props.data.length) return

  await nextTick()
  const container = chartRef.value
  container.innerHTML = ''

  const width = container.clientWidth
  const height = container.clientHeight
  const margin = { top: 30, right: 120, bottom: 50, left: 60 }
  const innerWidth = width - margin.left - margin.right
  const innerHeight = height - margin.top - margin.bottom

  const svg = d3.select(container)
    .append('svg')
    .attr('width', width)
    .attr('height', height)

  const g = svg.append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`)

  const allDates = [...new Set(props.data.flatMap(d => d.data.map(item => item.key)))].sort()

  const x = d3.scalePoint()
    .domain(allDates)
    .range([0, innerWidth])
    .padding(0.3)

  const maxVal = d3.max(props.data, d => d3.max(d.data, item => item[props.metric])) || 100

  const y = d3.scaleLinear()
    .domain([0, maxVal * 1.15])
    .range([innerHeight, 0])
    .nice()

  props.data.forEach((athlete, idx) => {
    const color = colors[idx % colors.length]
    const line = d3.line()
      .x(d => x(d.key))
      .y(d => y(d[props.metric]))
      .curve(d3.curveMonotoneX)

    g.append('path')
      .datum(athlete.data)
      .attr('fill', 'none')
      .attr('stroke', color)
      .attr('stroke-width', 2)
      .attr('d', line)
      .attr('data-athlete', athlete.athleteName)

    g.selectAll(`.point-${idx}`)
      .data(athlete.data)
      .enter()
      .append('circle')
      .attr('class', `data-point point-${idx}`)
      .attr('cx', d => x(d.key))
      .attr('cy', d => y(d[props.metric]))
      .attr('r', 4)
      .attr('fill', color)
      .attr('cursor', 'pointer')
      .on('click', (event, d) => emit('pointClick', { ...d, athlete: athlete.athleteName }))
  })

  const xAxis = g.append('g')
    .attr('transform', `translate(0,${innerHeight})`)
    .call(d3.axisBottom(x))

  xAxis.selectAll('text')
    .attr('transform', 'rotate(-45)')
    .style('text-anchor', 'end')
    .style('font-size', '10px')

  g.append('g')
    .call(d3.axisLeft(y).ticks(6))

  const legend = svg.append('g')
    .attr('transform', `translate(${innerWidth + 80}, 20)`)

  props.data.forEach((athlete, idx) => {
    const color = colors[idx % colors.length]
    legend.append('line')
      .attr('x1', 0).attr('x2', 20)
      .attr('y1', idx * 22 + 8).attr('y2', idx * 22 + 8)
      .attr('stroke', color).attr('stroke-width', 2)
    legend.append('text')
      .attr('x', 28).attr('y', idx * 22 + 12)
      .style('font-size', '11px').style('fill', '#606266')
      .text(`${athlete.athleteName} (${athlete.total})`)
  })

  const tooltip = d3.select(container)
    .append('div')
    .attr('class', 'tooltip')
    .style('opacity', 0)

  g.selectAll('.data-point')
    .on('mouseover', function(event, d) {
      const athlete = props.data.find(a => a.data.includes(d))
      d3.select(this).attr('r', 6)
      tooltip.transition().duration(200).style('opacity', .9)
      tooltip.html(`
        <div>${athlete?.athleteName}</div>
        <div>日期: ${d.key}</div>
        <div>${metricLabels[props.metric]?.name}: ${d[props.metric]} ${metricLabels[props.metric]?.unit}</div>
      `)
      .style('left', (event.offsetX + 10) + 'px')
      .style('top', (event.offsetY - 28) + 'px')
    })
    .on('mouseout', function() {
      d3.select(this).attr('r', 4)
      tooltip.transition().duration(500).style('opacity', 0)
    })
}

onMounted(renderChart)
watch(() => [props.data, props.metric], renderChart, { deep: true })
</script>

<style scoped>
.title-extra {
  font-size: 12px;
  color: #909399;
  font-weight: normal;
}
</style>
