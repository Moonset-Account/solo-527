<template>
  <div class="chart-wrapper" ref="chartRef"></div>
</template>

<script setup>
import { ref, onMounted, watch, nextTick } from 'vue'
import * as d3 from 'd3'

const props = defineProps({ data: { type: Array, default: () => [] } })
const emit = defineEmits(['drill'])
const chartRef = ref(null)
let svg = null
let tooltip = null

const initChart = () => {
  if (!chartRef.value) return
  const container = chartRef.value
  container.innerHTML = ''
  const width = container.clientWidth
  const height = 280
  const margin = { top: 20, right: 30, bottom: 50, left: 70 }
  svg = d3.select(container).append('svg').attr('width', width).attr('height', height)
  tooltip = d3.select(container).append('div').attr('class', 'tooltip').style('opacity', 0)
  renderChart(width, height, margin)
}

const renderChart = (width, height, margin) => {
  const innerWidth = width - margin.left - margin.right
  const innerHeight = height - margin.top - margin.bottom
  const data = props.data.slice(0, 8)
  
  if (!data.length) return
  
  const y = d3.scaleBand()
    .domain(data.map(d => d.technician))
    .range([0, innerHeight])
    .padding(0.25)
  
  const maxX = d3.max(data, d => Math.max(d.avgRepairTime, d.avgResponseTime))
  const x = d3.scaleLinear()
    .domain([0, maxX * 1.2])
    .range([0, innerWidth])
    .nice()
  
  const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`)
  
  for (let i = 1; i <= 4; i++) {
    g.append('line')
      .attr('class', 'grid-line')
      .attr('x1', x(maxX * 1.2 * i / 4)).attr('y1', 0)
      .attr('x2', x(maxX * 1.2 * i / 4)).attr('y2', innerHeight)
  }
  
  const barHeight = y.bandwidth() / 2 - 2
  
  data.forEach((d, i) => {
    const yPos = y(d.technician)
    
    g.append('rect')
      .attr('class', 'clickable')
      .attr('x', 0)
      .attr('y', yPos)
      .attr('width', 0)
      .attr('height', barHeight)
      .attr('fill', '#10b981')
      .attr('rx', 2)
      .on('mouseover', function(event) {
        d3.select(this).attr('opacity', 0.85)
        tooltip.transition().duration(200).style('opacity', 0.9)
        tooltip.html(`
          <strong>${d.technician}</strong><br/>
          班组: ${d.teamName}<br/>
          处理工单: ${d.count} 次<br/>
          平均修复: ${d.avgRepairTime} 分钟<br/>
          平均响应: ${d.avgResponseTime} 分钟<br/>
          总成本: ¥${d.totalCost.toFixed(0)}
        `)
        .style('left', (event.offsetX + 10) + 'px')
        .style('top', (event.offsetY - 10) + 'px')
      })
      .on('mousemove', function(event) {
        tooltip.style('left', (event.offsetX + 10) + 'px').style('top', (event.offsetY - 10) + 'px')
      })
      .on('mouseout', function() {
        d3.select(this).attr('opacity', 1)
        tooltip.transition().duration(500).style('opacity', 0)
      })
      .on('click', () => emit('drill', d))
      .transition()
      .duration(600)
      .delay(i * 80)
      .attr('width', x(d.avgRepairTime))
    
    g.append('rect')
      .attr('class', 'clickable')
      .attr('x', 0)
      .attr('y', yPos + barHeight + 4)
      .attr('width', 0)
      .attr('height', barHeight)
      .attr('fill', '#6366f1')
      .attr('rx', 2)
      .on('mouseover', function(event) {
        d3.select(this).attr('opacity', 0.85)
        tooltip.transition().duration(200).style('opacity', 0.9)
        tooltip.html(`
          <strong>${d.technician}</strong><br/>
          班组: ${d.teamName}<br/>
          处理工单: ${d.count} 次<br/>
          平均修复: ${d.avgRepairTime} 分钟<br/>
          平均响应: ${d.avgResponseTime} 分钟
        `)
        .style('left', (event.offsetX + 10) + 'px')
        .style('top', (event.offsetY - 10) + 'px')
      })
      .on('mousemove', function(event) {
        tooltip.style('left', (event.offsetX + 10) + 'px').style('top', (event.offsetY - 10) + 'px')
      })
      .on('mouseout', function() {
        d3.select(this).attr('opacity', 1)
        tooltip.transition().duration(500).style('opacity', 0)
      })
      .on('click', () => emit('drill', d))
      .transition()
      .duration(600)
      .delay(i * 80 + 200)
      .attr('width', x(d.avgResponseTime))
  })
  
  g.append('g')
    .call(d3.axisLeft(y))
    .selectAll('text')
    .style('font-size', '11px').style('fill', '#6b7280')
  
  g.append('g')
    .attr('transform', `translate(0,${innerHeight})`)
    .call(d3.axisBottom(x).ticks(5).tickFormat(d => d + '分'))
    .selectAll('text')
    .style('font-size', '11px').style('fill', '#6b7280')
  
  const legend = g.append('g').attr('transform', `translate(${innerWidth - 140}, 0)`)
  legend.append('rect').attr('x', 0).attr('y', 0).attr('width', 12).attr('height', 12).style('fill', '#10b981')
  legend.append('text').attr('x', 18).attr('y', 10).style('font-size', '11px').style('fill', '#6b7280').text('修复时长')
  legend.append('rect').attr('x', 80).attr('y', 0).attr('width', 12).attr('height', 12).style('fill', '#6366f1')
  legend.append('text').attr('x', 98).attr('y', 10).style('font-size', '11px').style('fill', '#6b7280').text('响应时长')
}

watch(() => props.data, () => nextTick(initChart), { deep: true })

onMounted(() => {
  nextTick(initChart)
  window.addEventListener('resize', initChart)
})
</script>

<style scoped>
.chart-wrapper { width: 100%; height: 100%; min-height: 280px; position: relative; }
</style>
