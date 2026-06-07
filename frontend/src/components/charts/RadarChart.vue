<template>
  <div class="chart-container">
    <div class="chart-title">
      <el-icon><Compass /></el-icon>
      <span>个人能力雷达</span>
      <span class="title-extra" v-if="athleteName">{{ athleteName }}</span>
    </div>
    <div class="chart-wrapper" ref="chartRef">
      <div class="loading-overlay" v-if="loading"><el-icon class="is-loading"><Loading /></el-icon></div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, nextTick } from 'vue'
import * as d3 from 'd3'
import { Compass, Loading } from '@element-plus/icons-vue'

const props = defineProps({
  data: { type: Array, default: () => [] },
  teamAvg: { type: Array, default: () => [] },
  athleteName: { type: String, default: '' },
  loading: { type: Boolean, default: false }
})

const chartRef = ref(null)

const renderChart = async () => {
  if (!chartRef.value || !props.data.length) return

  await nextTick()
  const container = chartRef.value
  container.innerHTML = ''

  const width = container.clientWidth
  const height = container.clientHeight
  const centerX = width / 2
  const centerY = height / 2
  const radius = Math.min(centerX, centerY) - 50

  const svg = d3.select(container)
    .append('svg')
    .attr('width', width)
    .attr('height', height)

  const g = svg.append('g')
    .attr('transform', `translate(${centerX},${centerY})`)

  const angleSlice = (Math.PI * 2) / props.data.length
  const maxValue = 100

  const levels = 5
  for (let i = 1; i <= levels; i++) {
    const levelRadius = (radius / levels) * i
    g.append('circle')
      .attr('cx', 0)
      .attr('cy', 0)
      .attr('r', levelRadius)
      .attr('fill', 'none')
      .attr('stroke', '#e5e7eb')
      .attr('stroke-dasharray', '3,3')
  }

  props.data.forEach((d, i) => {
    const angle = angleSlice * i - Math.PI / 2
    g.append('line')
      .attr('x1', 0)
      .attr('y1', 0)
      .attr('x2', Math.cos(angle) * radius)
      .attr('y2', Math.sin(angle) * radius)
      .attr('stroke', '#e5e7eb')
  })

  const createRadarPath = (dataSet, valueKey = 'value') => {
    return dataSet.map((d, i) => {
      const angle = angleSlice * i - Math.PI / 2
      const r = (d[valueKey] / maxValue) * radius
      return [Math.cos(angle) * r, Math.sin(angle) * r]
    }).join(' ')
  }

  if (props.teamAvg && props.teamAvg.length) {
    g.append('polygon')
      .attr('points', createRadarPath(props.teamAvg))
      .attr('fill', '#909399')
      .attr('fill-opacity', 0.15)
      .attr('stroke', '#909399')
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', '4,4')
  }

  g.append('polygon')
    .attr('points', createRadarPath(props.data))
    .attr('fill', '#409eff')
    .attr('fill-opacity', 0.3)
    .attr('stroke', '#409eff')
    .attr('stroke-width', 2)

  const tooltip = d3.select(container)
    .append('div')
    .attr('class', 'tooltip')
    .style('opacity', 0)

  props.data.forEach((d, i) => {
    const angle = angleSlice * i - Math.PI / 2
    const r = (d.value / maxValue) * radius

    g.append('circle')
      .attr('cx', Math.cos(angle) * r)
      .attr('cy', Math.sin(angle) * r)
      .attr('r', 5)
      .attr('fill', '#409eff')
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .on('mouseover', function(event) {
        d3.select(this).attr('r', 7)
        tooltip.transition().duration(200).style('opacity', .9)
        tooltip.html(`
          <div>${d.metric}</div>
          <div>个人: ${d.value}分</div>
          ${props.teamAvg[i] ? `<div>队均: ${props.teamAvg[i].value}分</div>` : ''}
        `)
        .style('left', (event.offsetX + 10) + 'px')
        .style('top', (event.offsetY - 28) + 'px')
      })
      .on('mouseout', function() {
        d3.select(this).attr('r', 5)
        tooltip.transition().duration(500).style('opacity', 0)
      })

    const labelRadius = radius + 25
    g.append('text')
      .attr('x', Math.cos(angle) * labelRadius)
      .attr('y', Math.sin(angle) * labelRadius)
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .style('font-size', '12px')
      .style('fill', '#606266')
      .text(d.metric)
  })

  const legend = svg.append('g').attr('transform', `translate(${width - 120}, 20)`)
  legend.append('rect').attr('width', 12).attr('height', 12).attr('fill', '#409eff').attr('fill-opacity', 0.5)
  legend.append('text').attr('x', 20).attr('y', 10).style('font-size', '11px').text('个人数据')
  legend.append('rect').attr('y', 20).attr('width', 12).attr('height', 12).attr('fill', '#909399').attr('fill-opacity', 0.3)
  legend.append('text').attr('x', 20).attr('y', 30).style('font-size', '11px').text('队伍平均')
}

onMounted(renderChart)
watch(() => [props.data, props.teamAvg], renderChart, { deep: true })
</script>

<style scoped>
.title-extra {
  font-size: 12px;
  color: #909399;
  font-weight: normal;
}
</style>
