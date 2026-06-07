<template>
  <ChartContainer 
    :sample-size="sampleSize" 
    :update-time="lastUpdate"
    :filters="filtersDesc"
  >
    <div ref="chartRef" class="power-curve"></div>
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

const powerReadings = computed(() => store.filteredPowerReadings.slice(0, 2000))
const sampleSize = computed(() => store.sampleSizes.powerCurve)
const lastUpdate = computed(() => store.lastUpdateTime)
const filtersDesc = computed(() => store.activeFiltersDesc)

let svg, g, xScale, yScale, line

const colors = [COLORS.primary, COLORS.success, COLORS.warning, COLORS.danger, '#9D65FF']

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

watch(powerReadings, () => {
  if (svg) renderChart()
}, { deep: true })

function initChart() {
  const container = chartRef.value
  if (!container) return
  
  const width = container.clientWidth
  const height = 280
  const margins = { top: 20, right: 30, bottom: 40, left: 50 }
  
  svg = d3.select(container)
    .append('svg')
    .attr('width', width)
    .attr('height', height)
  
  g = svg.append('g')
    .attr('transform', `translate(${margins.left}, ${margins.top})`)
  
  const innerWidth = width - margins.left - margins.right
  const innerHeight = height - margins.top - margins.bottom
  
  xScale = d3.scaleTime().range([0, innerWidth])
  yScale = d3.scaleLinear().range([innerHeight, 0])
  
  line = d3.line()
    .x(d => xScale(new Date(d.timestamp)))
    .y(d => yScale(d.power))
    .curve(d3.curveMonotoneX)
  
  g.append('g')
    .attr('class', 'grid')
  
  g.append('g')
    .attr('class', 'x-axis')
    .attr('transform', `translate(0, ${innerHeight})`)
  
  g.append('g')
    .attr('class', 'y-axis')
}

function renderChart() {
  if (!g || powerReadings.value.length === 0) return
  
  const container = chartRef.value
  const width = container.clientWidth
  const height = 280
  const margins = { top: 20, right: 30, bottom: 40, left: 50 }
  const innerWidth = width - margins.left - margins.right
  const innerHeight = height - margins.top - margins.bottom
  
  g.selectAll('.grid-lines').remove()
  g.selectAll('.anomaly-area').remove()
  g.selectAll('.power-line').remove()
  g.selectAll('.anomaly-dot').remove()
  
  const data = powerReadings.value
  
  xScale.domain(d3.extent(data, d => new Date(d.timestamp)))
  yScale.domain([0, d3.max(data, d => d.power) * 1.1])
  
  const grid = g.select('.grid')
  grid.selectAll('*').remove()
  grid.selectAll('line')
    .data(yScale.ticks(5))
    .enter()
    .append('line')
    .attr('class', 'grid-lines')
    .attr('x1', 0)
    .attr('x2', innerWidth)
    .attr('y1', d => yScale(d))
    .attr('y2', d => yScale(d))
    .attr('stroke', COLORS.border)
    .attr('stroke-opacity', 0.3)
    .attr('stroke-dasharray', '3,3')
  
  const xAxis = d3.axisBottom(xScale)
    .ticks(5)
    .tickFormat(d3.timeFormat('%H:%M'))
  
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
  
  const anomalies = data.filter(d => d.is_anomaly)
  anomalies.forEach(anomaly => {
    const t = new Date(anomaly.timestamp).getTime()
    const rangeStart = t - 5 * 60 * 1000
    const rangeEnd = t + 5 * 60 * 1000
    
    g.append('rect')
      .attr('class', 'anomaly-area')
      .attr('x', xScale(new Date(rangeStart)))
      .attr('y', 0)
      .attr('width', xScale(new Date(rangeEnd)) - xScale(new Date(rangeStart)))
      .attr('height', innerHeight)
      .attr('fill', COLORS.danger)
      .attr('fill-opacity', 0.1)
  })
  
  const groupedByCharger = {}
  data.forEach(d => {
    if (!groupedByCharger[d.charger_id]) {
      groupedByCharger[d.charger_id] = []
    }
    groupedByCharger[d.charger_id].push(d)
  })
  
  const chargerIds = Object.keys(groupedByCharger).slice(0, 5)
  
  chargerIds.forEach((chargerId, i) => {
    const chargerData = groupedByCharger[chargerId]
    
    g.append('path')
      .datum(chargerData)
      .attr('class', 'power-line')
      .attr('fill', 'none')
      .attr('stroke', colors[i % colors.length])
      .attr('stroke-width', 1.5)
      .attr('stroke-opacity', 0.8)
      .attr('d', line)
  })
  
  g.selectAll('.anomaly-dot')
    .data(anomalies)
    .enter()
    .append('circle')
    .attr('class', 'anomaly-dot')
    .attr('cx', d => xScale(new Date(d.timestamp)))
    .attr('cy', d => yScale(d.power))
    .attr('r', 4)
    .attr('fill', COLORS.danger)
    .style('cursor', 'pointer')
    .on('mouseover', function(event, d) {
      const html = `
        <div style="font-weight:600;margin-bottom:6px;color:${COLORS.danger}">⚠️ 功率异常</div>
        <div>功率: <span style="font-family:monospace">${d.power} kW</span></div>
        <div>时间: ${new Date(d.timestamp).toLocaleTimeString('zh-CN')}</div>
        <div>充电桩: ${d.charger_id}</div>
      `
      showTooltip(tooltip.value, html, event)
    })
    .on('mousemove', function(event) {
      tooltip.value
        .style('left', (event.pageX + 15) + 'px')
        .style('top', (event.pageY - 10) + 'px')
    })
    .on('mouseout', () => hideTooltip(tooltip.value))
}
</script>

<style lang="scss" scoped>
.power-curve {
  width: 100%;
  height: 100%;
  min-height: 280px;
  
  :deep(svg) {
    width: 100%;
    height: 100%;
  }
}
</style>
