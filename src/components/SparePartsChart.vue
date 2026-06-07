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
  const margin = { top: 20, right: 30, bottom: 50, left: 110 }
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
    .domain(data.map(d => d.partName))
    .range([0, innerHeight])
    .padding(0.3)
  
  const x = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.totalCost) * 1.15])
    .range([0, innerWidth])
    .nice()
  
  const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`)
  
  for (let i = 1; i <= 4; i++) {
    g.append('line')
      .attr('class', 'grid-line')
      .attr('x1', x(d3.max(data, d => d.totalCost) * 1.15 * i / 4)).attr('y1', 0)
      .attr('x2', x(d3.max(data, d => d.totalCost) * 1.15 * i / 4)).attr('y2', innerHeight)
  }
  
  g.selectAll('.bar')
    .data(data)
    .enter()
    .append('rect')
    .attr('class', 'bar clickable')
    .attr('x', 0)
    .attr('y', d => y(d.partName))
    .attr('width', 0)
    .attr('height', y.bandwidth())
    .attr('fill', '#8b5cf6')
    .attr('rx', 2)
    .on('mouseover', function(event, d) {
      d3.select(this).attr('opacity', 0.85)
      tooltip.transition().duration(200).style('opacity', 0.9)
      tooltip.html(`
        <strong>${d.partName}</strong><br/>
        使用次数: ${d.usageCount} 次<br/>
        总数量: ${d.totalQuantity} 件<br/>
        总成本: ¥${d.totalCost.toFixed(0)}<br/>
        关联停机: ${Math.round(d.relatedDowntimeMinutes / 60 * 10) / 10}h
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
    .on('click', function(event, d) {
      emit('drill', d)
    })
    .transition()
    .duration(600)
    .delay((d, i) => i * 80)
    .attr('width', d => x(d.totalCost))
  
  g.selectAll('.bar-label')
    .data(data)
    .enter()
    .append('text')
    .attr('class', 'bar-label')
    .attr('x', d => x(d.totalCost) + 8)
    .attr('y', d => y(d.partName) + y.bandwidth() / 2)
    .attr('dy', '0.35em')
    .style('font-size', '11px')
    .style('fill', '#6b7280')
    .style('opacity', 0)
    .text(d => '¥' + d.totalCost.toFixed(0))
    .transition()
    .duration(600)
    .delay((d, i) => i * 80 + 300)
    .style('opacity', 1)
  
  g.append('g')
    .call(d3.axisLeft(y))
    .selectAll('text')
    .style('font-size', '11px').style('fill', '#6b7280')
  
  g.append('g')
    .attr('transform', `translate(0,${innerHeight})`)
    .call(d3.axisBottom(x).ticks(5).tickFormat(d => '¥' + Math.round(d)))
    .selectAll('text')
    .style('font-size', '11px').style('fill', '#6b7280')
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
