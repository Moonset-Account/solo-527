<template>
  <div class="chart-wrapper" ref="chartRef"></div>
</template>

<script setup>
import { ref, onMounted, watch, nextTick } from 'vue'
import * as d3 from 'd3'

const props = defineProps({
  data: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['drill'])

const chartRef = ref(null)
let svg = null
let tooltip = null

const CATEGORY_COLORS = {
  mechanical: '#e74c3c',
  electrical: '#f39c12',
  control: '#9b59b6',
  hydraulic: '#3498db',
  pneumatic: '#1abc9c',
  lubrication: '#e67e22',
  wear: '#95a5a6',
  operation: '#34495e'
}

const initChart = () => {
  if (!chartRef.value) return
  
  const container = chartRef.value
  container.innerHTML = ''
  
  const width = container.clientWidth
  const height = 280
  const margin = { top: 20, right: 60, bottom: 70, left: 60 }
  
  svg = d3.select(container)
    .append('svg')
    .attr('width', width)
    .attr('height', height)
  
  tooltip = d3.select(container)
    .append('div')
    .attr('class', 'tooltip')
    .style('opacity', 0)
  
  renderChart(width, height, margin)
}

const renderChart = (width, height, margin) => {
  const innerWidth = width - margin.left - margin.right
  const innerHeight = height - margin.top - margin.bottom
  
  const data = props.data.slice(0, 10)
  
  const x = d3.scaleBand()
    .domain(data.map(d => d.categoryName))
    .range([0, innerWidth])
    .padding(0.3)
  
  const yBar = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.totalMinutes)])
    .range([innerHeight, 0])
    .nice()
  
  const yLine = d3.scaleLinear()
    .domain([0, 1])
    .range([innerHeight, 0])
  
  const g = svg.append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`)
  
  g.append('line')
    .attr('class', 'grid-line')
    .attr('x1', 0)
    .attr('y1', yLine(0.8))
    .attr('x2', innerWidth)
    .attr('y2', yLine(0.8))
    .style('stroke-dasharray', '3,3')
    .style('stroke', '#f59e0b')
    .style('stroke-width', 1)
    .style('opacity', 0.6)
  
  g.append('text')
    .attr('x', innerWidth + 5)
    .attr('y', yLine(0.8))
    .attr('dy', '0.35em')
    .style('font-size', '10px')
    .style('fill', '#f59e0b')
    .text('80%')
  
  const bars = g.selectAll('.bar')
    .data(data)
    .enter()
    .append('rect')
    .attr('class', 'bar clickable')
    .attr('x', d => x(d.categoryName))
    .attr('y', innerHeight)
    .attr('width', x.bandwidth())
    .attr('height', 0)
    .attr('fill', d => CATEGORY_COLORS[d.category] || '#6b7280')
    .attr('rx', 3)
    .on('mouseover', function(event, d) {
      d3.select(this).attr('opacity', 0.8)
      tooltip.transition().duration(200).style('opacity', 0.9)
      tooltip.html(`
        <strong>${d.categoryName}</strong><br/>
        停机次数: ${d.count} 次<br/>
        停机时长: ${Math.round(d.totalMinutes / 60 * 10) / 10} 小时<br/>
        占比: ${(d.percentage * 100).toFixed(1)}%<br/>
        累计占比: ${(d.cumulativePercentage * 100).toFixed(1)}%
      `)
      .style('left', (event.offsetX + 10) + 'px')
      .style('top', (event.offsetY - 10) + 'px')
    })
    .on('mousemove', function(event) {
      tooltip
        .style('left', (event.offsetX + 10) + 'px')
        .style('top', (event.offsetY - 10) + 'px')
    })
    .on('mouseout', function() {
      d3.select(this).attr('opacity', 1)
      tooltip.transition().duration(500).style('opacity', 0)
    })
    .on('click', (event, d) => {
      emit('drill', d)
    })
  
  bars.transition()
    .duration(800)
    .delay((d, i) => i * 50)
    .attr('y', d => yBar(d.totalMinutes))
    .attr('height', d => innerHeight - yBar(d.totalMinutes))
  
  g.selectAll('.bar-value')
    .data(data)
    .enter()
    .append('text')
    .attr('class', 'bar-label')
    .attr('x', d => x(d.categoryName) + x.bandwidth() / 2)
    .attr('y', d => yBar(d.totalMinutes) - 5)
    .attr('text-anchor', 'middle')
    .style('font-size', '10px')
    .style('opacity', 0)
    .text(d => `${Math.round(d.totalMinutes / 60)}h`)
    .transition()
    .duration(800)
    .delay((d, i) => i * 50 + 400)
    .style('opacity', 1)
  
  const line = d3.line()
    .x(d => x(d.categoryName) + x.bandwidth() / 2)
    .y(d => yLine(d.cumulativePercentage))
    .curve(d3.curveMonotoneX)
  
  g.append('path')
    .datum(data)
    .attr('class', 'pareto-line')
    .attr('d', line)
    .style('opacity', 0)
    .transition()
    .duration(1000)
    .delay(400)
    .style('opacity', 1)
  
  g.selectAll('.pareto-dot')
    .data(data)
    .enter()
    .append('circle')
    .attr('class', 'pareto-dot')
    .attr('cx', d => x(d.categoryName) + x.bandwidth() / 2)
    .attr('cy', d => yLine(d.cumulativePercentage))
    .attr('r', 4)
    .style('opacity', 0)
    .transition()
    .duration(800)
    .delay((d, i) => i * 50 + 400)
    .style('opacity', 1)
  
  g.append('g')
    .attr('transform', `translate(0,${innerHeight})`)
    .call(d3.axisBottom(x))
    .selectAll('text')
    .style('font-size', '11px')
    .style('fill', '#6b7280')
    .attr('transform', 'rotate(-30)')
    .style('text-anchor', 'end')
  
  g.append('g')
    .call(d3.axisLeft(yBar).ticks(5))
    .selectAll('text')
    .style('font-size', '11px')
    .style('fill', '#6b7280')
  
  g.append('g')
    .attr('transform', `translate(${innerWidth},0)`)
    .call(d3.axisRight(yLine).ticks(5).tickFormat(d => (d * 100).toFixed(0) + '%'))
    .selectAll('text')
    .style('font-size', '11px')
    .style('fill', '#f59e0b')
  
  g.append('text')
    .attr('transform', 'rotate(-90)')
    .attr('x', -innerHeight / 2)
    .attr('y', -45)
    .attr('text-anchor', 'middle')
    .style('font-size', '11px')
    .style('fill', '#6b7280')
    .text('停机时长 (分钟)')
}

watch(() => props.data, () => {
  nextTick(() => {
    initChart()
  })
}, { deep: true })

onMounted(() => {
  nextTick(() => {
    initChart()
  })
  
  window.addEventListener('resize', initChart)
})
</script>

<style scoped>
.chart-wrapper {
  width: 100%;
  height: 100%;
  min-height: 280px;
  position: relative;
}
</style>
