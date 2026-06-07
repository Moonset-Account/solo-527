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
  const margin = { top: 20, right: 30, bottom: 50, left: 60 }
  svg = d3.select(container).append('svg').attr('width', width).attr('height', height)
  tooltip = d3.select(container).append('div').attr('class', 'tooltip').style('opacity', 0)
  renderChart(width, height, margin)
}

const renderChart = (width, height, margin) => {
  const innerWidth = width - margin.left - margin.right
  const innerHeight = height - margin.top - margin.bottom
  const data = props.data
  
  if (!data.length) return
  
  const subgroups = ['unplannedMinutes', 'plannedMinutes']
  const groups = data.map(d => d.lineName.replace(/^[A-D]线 - /, ''))
  
  const x = d3.scaleBand()
    .domain(groups)
    .range([0, innerWidth])
    .padding([0.2])
  
  const xSubgroup = d3.scaleBand()
    .domain(subgroups)
    .range([0, x.bandwidth()])
    .padding([0.05])
  
  const maxY = d3.max(data, d => Math.max(d.unplannedMinutes, d.plannedMinutes))
  const y = d3.scaleLinear()
    .domain([0, maxY * 1.15])
    .range([innerHeight, 0])
    .nice()
  
  const color = { unplannedMinutes: '#ef4444', plannedMinutes: '#3b82f6' }
  
  const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`)
  
  for (let i = 0; i <= 4; i++) {
    g.append('line')
      .attr('class', 'grid-line')
      .attr('x1', 0).attr('y1', y(maxY * 1.15 * i / 4))
      .attr('x2', innerWidth).attr('y2', y(maxY * 1.15 * i / 4))
  }
  
  g.append('g')
    .selectAll('g')
    .data(data)
    .enter()
    .append('g')
    .attr('transform', d => `translate(${x(d.lineName.replace(/^[A-D]线 - /, ''))},0)`)
    .selectAll('rect')
    .data(d => subgroups.map(key => ({ key, value: d[key], lineData: d })))
    .enter()
    .append('rect')
    .attr('class', 'clickable')
    .attr('x', d => xSubgroup(d.key))
    .attr('y', innerHeight)
    .attr('width', xSubgroup.bandwidth())
    .attr('height', 0)
    .attr('fill', d => color[d.key])
    .attr('rx', 2)
    .on('mouseover', function(event, d) {
      d3.select(this).attr('opacity', 0.85)
      tooltip.transition().duration(200).style('opacity', 0.9)
      const label = d.key === 'unplannedMinutes' ? '突发停机' : '计划检修'
      tooltip.html(`
        <strong>${d.lineData.lineName}</strong><br/>
        ${label}: ${Math.round(d.value / 60 * 10) / 10}h<br/>
        次数: ${d.key === 'unplannedMinutes' ? d.lineData.unplannedCount : d.lineData.plannedCount} 次<br/>
        平均时长: ${d.lineData.avgDuration} 分钟
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
    .on('click', (event, d) => emit('drill', d.lineData))
    .transition()
    .duration(600)
    .delay((d, i) => i * 100)
    .attr('y', d => y(d.value))
    .attr('height', d => innerHeight - y(d.value))
  
  g.append('g')
    .attr('transform', `translate(0,${innerHeight})`)
    .call(d3.axisBottom(x))
    .selectAll('text')
    .style('font-size', '11px').style('fill', '#6b7280')
  
  g.append('g')
    .call(d3.axisLeft(y).ticks(5).tickFormat(d => Math.round(d / 60) + 'h'))
    .selectAll('text')
    .style('font-size', '11px').style('fill', '#6b7280')
  
  const legend = g.append('g').attr('transform', `translate(${innerWidth - 140}, 0)`)
  legend.append('rect').attr('x', 0).attr('y', 0).attr('width', 12).attr('height', 12).style('fill', '#ef4444')
  legend.append('text').attr('x', 18).attr('y', 10).style('font-size', '11px').style('fill', '#6b7280').text('突发')
  legend.append('rect').attr('x', 70).attr('y', 0).attr('width', 12).attr('height', 12).style('fill', '#3b82f6')
  legend.append('text').attr('x', 88).attr('y', 10).style('font-size', '11px').style('fill', '#6b7280').text('计划')
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
