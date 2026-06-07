<template>
  <div class="chart-wrapper" ref="chartRef"></div>
</template>

<script setup>
import { ref, onMounted, watch, nextTick } from 'vue'
import * as d3 from 'd3'
import dayjs from 'dayjs'

const props = defineProps({
  data: { type: Array, default: () => [] }
})

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
  const margin = { top: 20, right: 30, bottom: 50, left: 50 }
  
  svg = d3.select(container).append('svg').attr('width', width).attr('height', height)
  tooltip = d3.select(container).append('div').attr('class', 'tooltip').style('opacity', 0)
  
  renderChart(width, height, margin)
}

const renderChart = (width, height, margin) => {
  const innerWidth = width - margin.left - margin.right
  const innerHeight = height - margin.top - margin.bottom
  const data = props.data.slice(-30)
  
  if (!data.length) return
  
  const x = d3.scaleTime()
    .domain(d3.extent(data, d => new Date(d.date)))
    .range([0, innerWidth])
  
  const maxY = d3.max(data, d => Math.max(d.plannedMinutes, d.unplannedMinutes))
  const y = d3.scaleLinear()
    .domain([0, maxY * 1.1])
    .range([innerHeight, 0])
    .nice()
  
  const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`)
  
  for (let i = 0; i <= 4; i++) {
    const yPos = y(maxY * 1.1 * i / 4)
    g.append('line')
      .attr('class', 'grid-line')
      .attr('x1', 0).attr('y1', yPos)
      .attr('x2', innerWidth).attr('y2', yPos)
  }
  
  const stack = d3.stack()
    .keys(['unplannedMinutes', 'plannedMinutes'])
    .order(d3.stackOrderReverse)
  
  const series = stack(data)
  
  const colors = ['#ef4444', '#3b82f6']
  
  const area = d3.area()
    .x(d => x(new Date(d.data.date)))
    .y0(d => y(d[0]))
    .y1(d => y(d[1]))
    .curve(d3.curveMonotoneX)
  
  g.selectAll('.area')
    .data(series)
    .enter()
    .append('path')
    .attr('class', 'area')
    .attr('d', area)
    .style('fill', (d, i) => colors[i])
    .style('opacity', 0.85)
  
  const lineUnplanned = d3.line()
    .x(d => x(new Date(d.date)))
    .y(d => y(d.unplannedMinutes))
    .curve(d3.curveMonotoneX)
  
  const linePlanned = d3.line()
    .x(d => x(new Date(d.date)))
    .y(d => y(d.plannedMinutes))
    .curve(d3.curveMonotoneX)
  
  g.append('path')
    .attr('d', lineUnplanned(data))
    .style('fill', 'none')
    .style('stroke', '#dc2626')
    .style('stroke-width', 2)
  
  g.append('path')
    .attr('d', linePlanned(data))
    .style('fill', 'none')
    .style('stroke', '#2563eb')
    .style('stroke-width', 2)
  
  const bisect = d3.bisector(d => new Date(d.date)).left
  
  const focus = g.append('g').style('display', 'none')
  
  focus.append('line')
    .attr('class', 'grid-line')
    .attr('y1', 0).attr('y2', innerHeight)
    .style('stroke', '#999').style('stroke-dasharray', '3,3')
  
  focus.append('circle').attr('r', 4).style('fill', '#ef4444')
  focus.append('circle').attr('r', 4).style('fill', '#3b82f6')
  
  svg.on('mouseover', () => focus.style('display', null))
     .on('mouseout', () => {
       focus.style('display', 'none')
       tooltip.transition().duration(500).style('opacity', 0)
     })
     .on('mousemove', function(event) {
       const [mx] = d3.pointer(event)
       const x0 = x.invert(mx - margin.left)
       const i = bisect(data, x0, 1)
       const d0 = data[i - 1]
       const d1 = data[i]
       const d = x0 - new Date(d0?.date || 0) > new Date(d1?.date || 0) - x0 ? d1 : d0
       
       if (!d) return
       
       const xPos = x(new Date(d.date))
       
       focus.select('line').attr('transform', `translate(${xPos},0)`)
       
       tooltip.transition().duration(200).style('opacity', 0.9)
       tooltip.html(`
         <strong>${dayjs(d.date).format('MM-DD')}</strong><br/>
         <span style="color:#ef4444">●</span> 突发: ${Math.round(d.unplannedMinutes / 6) / 10}h (${d.unplannedCount}次)<br/>
         <span style="color:#3b82f6">●</span> 计划: ${Math.round(d.plannedMinutes / 6) / 10}h (${d.plannedCount}次)<br/>
         <span style="color:#9ca3af;font-size:11px">点击查看当日工单</span>
       `)
       .style('left', (event.offsetX + 15) + 'px')
       .style('top', (event.offsetY - 10) + 'px')
     })
     .on('click', function(event) {
       const [mx] = d3.pointer(event)
       const x0 = x.invert(mx - margin.left)
       const i = bisect(data, x0, 1)
       const d0 = data[i - 1]
       const d1 = data[i]
       const d = x0 - new Date(d0?.date || 0) > new Date(d1?.date || 0) - x0 ? d1 : d0
       if (d) emit('drill', d)
     })
  
  g.append('g')
    .attr('transform', `translate(0,${innerHeight})`)
    .call(d3.axisBottom(x).ticks(6).tickFormat(d => dayjs(d).format('MM-DD')))
    .selectAll('text')
    .style('font-size', '11px').style('fill', '#6b7280')
  
  g.append('g')
    .call(d3.axisLeft(y).ticks(5).tickFormat(d => Math.round(d / 60) + 'h'))
    .selectAll('text')
    .style('font-size', '11px').style('fill', '#6b7280')
  
  const legend = g.append('g').attr('transform', `translate(${innerWidth - 140}, 0)`)
  
  legend.append('rect').attr('x', 0).attr('y', 0).attr('width', 12).attr('height', 12).style('fill', '#ef4444')
  legend.append('text').attr('x', 18).attr('y', 10).style('font-size', '11px').style('fill', '#6b7280').text('突发停机')
  
  legend.append('rect').attr('x', 90).attr('y', 0).attr('width', 12).attr('height', 12).style('fill', '#3b82f6')
  legend.append('text').attr('x', 108).attr('y', 10).style('font-size', '11px').style('fill', '#6b7280').text('计划检修')
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
