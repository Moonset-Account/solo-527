<template>
  <ChartContainer 
    :sample-size="sampleSize" 
    :update-time="lastUpdate"
    :filters="filtersDesc"
  >
    <div ref="chartRef" class="hourly-faults"></div>
  </ChartContainer>
</template>

<script setup>
import { ref, onMounted, watch, computed, onUnmounted } from 'vue'
import * as d3 from 'd3'
import ChartContainer from '@/components/common/ChartContainer.vue'
import { useDataStore } from '@/stores/dataStore.js'
import { COLORS, createTooltip, showTooltip, hideTooltip } from '@/utils/d3Helpers.js'

const store = useDataStore()
const chartRef = ref(null)
const tooltip = ref(null)

const faultsByHour = computed(() => store.faultsByHour)
const sampleSize = computed(() => store.filteredFaults.length)
const lastUpdate = computed(() => store.lastUpdateTime)
const filtersDesc = computed(() => store.activeFiltersDesc)

let svg, g, xScale, yScale

onMounted(() => {
  tooltip.value = createTooltip()
  initChart()
  renderChart()
})

onUnmounted(() => {
  if (tooltip.value) {
    tooltip.value.remove()
  }
})

watch(faultsByHour, () => {
  if (svg) renderChart()
}, { deep: true })

function initChart() {
  const container = chartRef.value
  if (!container) return
  
  const width = container.clientWidth
  const height = 280
  const margins = { top: 20, right: 20, bottom: 40, left: 50 }
  
  svg = d3.select(container)
    .append('svg')
    .attr('width', width)
    .attr('height', height)
  
  g = svg.append('g')
    .attr('transform', `translate(${margins.left}, ${margins.top})`)
  
  const innerWidth = width - margins.left - margins.right
  const innerHeight = height - margins.top - margins.bottom
  
  xScale = d3.scaleBand()
    .domain(Array.from({ length: 24 }, (_, i) => i))
    .range([0, innerWidth])
    .padding(0.2)
  
  yScale = d3.scaleLinear()
    .range([innerHeight, 0])
  
  g.append('g')
    .attr('class', 'x-axis')
    .attr('transform', `translate(0, ${innerHeight})`)
  
  g.append('g')
    .attr('class', 'y-axis')
}

function renderChart() {
  if (!g || faultsByHour.value.length === 0) return
  
  const container = chartRef.value
  const width = container.clientWidth
  const height = 280
  const margins = { top: 20, right: 20, bottom: 40, left: 50 }
  const innerWidth = width - margins.left - margins.right
  const innerHeight = height - margins.top - margins.bottom
  
  g.selectAll('.bar').remove()
  g.selectAll('.peak-marker').remove()
  
  const data = faultsByHour.value
  const maxCount = d3.max(data, d => d.count) || 1
  
  yScale.domain([0, maxCount * 1.2])
  
  const xAxis = d3.axisBottom(xScale)
    .tickValues([0, 3, 6, 9, 12, 15, 18, 21])
    .tickFormat(d => `${d}:00`)
  
  g.select('.x-axis')
    .call(xAxis)
    .selectAll('text')
    .attr('fill', COLORS.text.secondary)
    .attr('font-size', '10px')
  
  g.select('.x-axis').selectAll('.domain, .tick line')
    .attr('stroke', COLORS.border)
  
  const yAxis = d3.axisLeft(yScale)
    .ticks(5)
  
  g.select('.y-axis')
    .call(yAxis)
    .selectAll('text')
    .attr('fill', COLORS.text.secondary)
    .attr('font-size', '10px')
  
  g.select('.y-axis').selectAll('.domain, .tick line')
    .attr('stroke', COLORS.border)
  
  const peakHour = data.reduce((max, d) => d.count > max.count ? d : max, data[0])
  
  const bars = g.selectAll('.bar')
    .data(data)
    .enter()
    .append('rect')
    .attr('class', 'bar')
    .attr('x', d => xScale(d.hour))
    .attr('y', innerHeight)
    .attr('width', xScale.bandwidth())
    .attr('height', 0)
    .attr('fill', d => {
      if (d.hour === peakHour.hour) return COLORS.danger
      if (d.count === 0) return COLORS.border
      return COLORS.primary
    })
    .attr('fill-opacity', d => d.hour === peakHour.hour ? 0.9 : 0.7)
    .attr('rx', 3)
    .style('cursor', 'pointer')
  
  bars.transition()
    .duration(600)
    .delay((d, i) => i * 20)
    .attr('y', d => yScale(d.count))
    .attr('height', d => innerHeight - yScale(d.count))
  
  bars
    .on('mouseover', function(event, d) {
      d3.select(this)
        .transition()
        .duration(150)
        .attr('fill-opacity', 1)
      
      const isPeak = d.hour === peakHour.hour
      const html = `
        <div style="font-weight:600;margin-bottom:6px;color:${isPeak ? COLORS.danger : COLORS.text.primary}">
          ${isPeak ? '⚡ 高峰时段' : ''}${d.hour}:00 - ${d.hour + 1}:00
        </div>
        <div>故障次数: <span style="font-family:monospace;color:${COLORS.primary}">${d.count}</span></div>
        <div style="margin-top:4px;color:${COLORS.text.muted};font-size:11px">
          占比: ${((d.count / (sampleSize.value || 1)) * 100).toFixed(1)}%
        </div>
      `
      showTooltip(tooltip.value, html, event)
    })
    .on('mousemove', function(event) {
      tooltip.value
        .style('left', (event.pageX + 15) + 'px')
        .style('top', (event.pageY - 10) + 'px')
    })
    .on('mouseout', function(event, d) {
      d3.select(this)
        .transition()
        .duration(150)
        .attr('fill-opacity', d.hour === peakHour.hour ? 0.9 : 0.7)
      
      hideTooltip(tooltip.value)
    })
  
  if (peakHour && peakHour.count > 0) {
    g.append('text')
      .attr('class', 'peak-marker')
      .attr('x', xScale(peakHour.hour) + xScale.bandwidth() / 2)
      .attr('y', yScale(peakHour.count) - 8)
      .attr('text-anchor', 'middle')
      .attr('fill', COLORS.danger)
      .attr('font-size', '10px')
      .attr('font-weight', 'bold')
      .text('峰值')
  }
}
</script>

<style lang="scss" scoped>
.hourly-faults {
  width: 100%;
  height: 100%;
  min-height: 280px;
  
  :deep(svg) {
    width: 100%;
    height: 100%;
  }
}
</style>
