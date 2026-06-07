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
  const margin = { top: 20, right: 30, bottom: 50, left: 130 }
  svg = d3.select(container).append('svg').attr('width', width).attr('height', height)
  tooltip = d3.select(container).append('div').attr('class', 'tooltip').style('opacity', 0)
  renderChart(width, height, margin)
}

const renderChart = (width, height, margin) => {
  const innerWidth = width - margin.left - margin.right
  const innerHeight = height - margin.top - margin.bottom
  const data = props.data.slice(0, 10)
  
  if (!data.length) return
  
  const y = d3.scaleBand()
    .domain(data.map(d => d.equipmentName))
    .range([0, innerHeight])
    .padding(0.25)
  
  const maxX = d3.max(data, d => d.unplannedMinutes + d.plannedMinutes)
  const x = d3.scaleLinear()
    .domain([0, maxX * 1.15])
    .range([0, innerWidth])
    .nice()
  
  const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`)
  
  for (let i = 1; i <= 4; i++) {
    g.append('line')
      .attr('class', 'grid-line')
      .attr('x1', x(maxX * 1.15 * i / 4)).attr('y1', 0)
      .attr('x2', x(maxX * 1.15 * i / 4)).attr('y2', innerHeight)
  }
  
  const stack = d3.stack()
    .keys(['plannedMinutes', 'unplannedMinutes'])
    .order(d3.stackOrderReverse)
  
  const series = stack(data)
  const colors = ['#3b82f6', '#ef4444']
  
  g.selectAll('.serie')
    .data(series)
    .enter()
    .append('g')
    .attr('class', 'serie')
    .selectAll('rect')
    .data(d => d)
    .enter()
    .append('rect')
    .attr('class', 'clickable')
    .attr('x', d => x(d[0]))
    .attr('y', d => y(d.data.equipmentName))
    .attr('width', 0)
    .attr('height', y.bandwidth())
    .attr('fill', (d, i, nodes) => {
      const parent = d3.select(nodes[i].parentNode)
      const idx = parent.datum().key === 'unplannedMinutes' ? 1 : 0
      return colors[idx]
    })
    .on('mouseover', function(event, d) {
      d3.select(this).attr('opacity', 0.85)
      tooltip.transition().duration(200).style('opacity', 0.9)
      tooltip.html(`
        <strong>${d.data.equipmentName}</strong><br/>
        所属产线: ${d.data.lineName}<br/>
        突发停机: ${Math.round(d.data.unplannedMinutes / 60 * 10) / 10}h (${d.data.unplannedCount}次)<br/>
        计划检修: ${Math.round(d.data.plannedMinutes / 60 * 10) / 10}h (${d.data.plannedCount}次)<br/>
        平均修复: ${d.data.avgRepairTime} 分钟<br/>
        总成本: ¥${d.data.totalCost.toFixed(0)}
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
    .on('click', (event, d) => emit('drill', d.data))
    .transition()
    .duration(600)
    .delay((d, i) => i * 60)
    .attr('width', d => x(d[1]) - x(d[0]))
  
  g.append('g')
    .call(d3.axisLeft(y))
    .selectAll('text')
    .style('font-size', '10px').style('fill', '#6b7280')
  
  g.append('g')
    .attr('transform', `translate(0,${innerHeight})`)
    .call(d3.axisBottom(x).ticks(5).tickFormat(d => Math.round(d / 60) + 'h'))
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
