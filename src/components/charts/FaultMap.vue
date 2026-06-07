<template>
  <ChartContainer 
    :sample-size="sampleSize" 
    :update-time="lastUpdate"
    :filters="filtersDesc"
  >
    <div ref="chartRef" class="fault-map"></div>
  </ChartContainer>
</template>

<script setup>
import { ref, onMounted, watch, computed, onUnmounted } from 'vue'
import * as d3 from 'd3'
import ChartContainer from '@/components/common/ChartContainer.vue'
import { useDataStore } from '@/stores/dataStore.js'
import { COLORS, SEVERITY_COLORS, createTooltip, showTooltip, hideTooltip, formatNumber } from '@/utils/d3Helpers.js'

const store = useDataStore()
const chartRef = ref(null)
const tooltip = ref(null)

const stationStats = computed(() => store.faultsByStation)
const sampleSize = computed(() => store.sampleSizes.faultMap)
const lastUpdate = computed(() => store.lastUpdateTime)
const filtersDesc = computed(() => store.activeFiltersDesc)

let svg, g, projection, path

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

watch(stationStats, () => {
  if (svg) renderChart()
}, { deep: true })

function initChart() {
  const container = chartRef.value
  if (!container) return
  
  const width = container.clientWidth
  const height = 320
  
  svg = d3.select(container)
    .append('svg')
    .attr('width', width)
    .attr('height', height)
    .attr('viewBox', `0 0 ${width} ${height}`)
  
  g = svg.append('g')
  
  const padding = 40
  const lats = stationStats.value.map(s => s.lat)
  const lngs = stationStats.value.map(s => s.lng)
  const latMin = Math.min(...lats)
  const latMax = Math.max(...lats)
  const lngMin = Math.min(...lngs)
  const lngMax = Math.max(...lngs)
  
  const xScale = d3.scaleLinear()
    .domain([lngMin - 0.01, lngMax + 0.01])
    .range([padding, width - padding])
  
  const yScale = d3.scaleLinear()
    .domain([latMax + 0.01, latMin - 0.01])
    .range([padding, height - padding])
  
  window._xScale = xScale
  window._yScale = yScale
}

function renderChart() {
  if (!g || stationStats.value.length === 0) return
  
  const container = chartRef.value
  const width = container.clientWidth
  const height = 320
  
  g.selectAll('*').remove()
  
  const xScale = window._xScale
  const yScale = window._yScale
  
  const maxFaults = d3.max(stationStats.value, d => d.fault_count) || 1
  const radiusScale = d3.scaleSqrt()
    .domain([0, maxFaults])
    .range([4, 18])
  
  g.selectAll('.station-dot')
    .data(stationStats.value)
    .enter()
    .append('circle')
    .attr('class', 'station-dot')
    .attr('cx', d => xScale(d.lng))
    .attr('cy', d => yScale(d.lat))
    .attr('r', d => radiusScale(d.fault_count))
    .attr('fill', d => {
      if (d.availability < 0.7) return COLORS.danger
      if (d.availability < 0.85) return COLORS.warning
      return COLORS.success
    })
    .attr('fill-opacity', 0.7)
    .attr('stroke', d => {
      if (d.availability < 0.7) return COLORS.danger
      if (d.availability < 0.85) return COLORS.warning
      return COLORS.success
    })
    .attr('stroke-width', 2)
    .style('cursor', 'pointer')
    .style('filter', 'drop-shadow(0 0 8px)')
    .on('mouseover', function(event, d) {
      d3.select(this)
        .transition()
        .duration(150)
        .attr('r', radiusScale(d.fault_count) * 1.3)
        .attr('fill-opacity', 0.9)
      
      const html = `
        <div style="font-weight:600;margin-bottom:6px;color:${COLORS.text.primary}">${d.name}</div>
        <div style="margin-bottom:4px">故障数: <span style="font-family:monospace;color:${COLORS.danger}">${d.fault_count}</span></div>
        <div style="margin-bottom:4px">可用率: <span style="font-family:monospace;color:${COLORS.success}">${(d.availability * 100).toFixed(1)}%</span></div>
        <div>充电桩: ${d.charger_count} 台</div>
        <div style="margin-top:6px;color:${COLORS.text.muted};font-size:11px">点击下钻查看详情</div>
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
        .attr('r', radiusScale(d.fault_count))
        .attr('fill-opacity', 0.7)
      
      hideTooltip(tooltip.value)
    })
    .on('click', function(event, d) {
      store.drillToStation(d.id)
    })
  
  g.selectAll('.station-label')
    .data(stationStats.value.filter(d => d.fault_count >= maxFaults * 0.5))
    .enter()
    .append('text')
    .attr('class', 'station-label')
    .attr('x', d => xScale(d.lng))
    .attr('y', d => yScale(d.lat) - radiusScale(d.fault_count) - 8)
    .attr('text-anchor', 'middle')
    .attr('fill', COLORS.text.secondary)
    .attr('font-size', '10px')
    .text(d => d.name.replace('充电站', ''))
}
</script>

<style lang="scss" scoped>
.fault-map {
  width: 100%;
  height: 100%;
  min-height: 320px;
  position: relative;
  
  :deep(svg) {
    width: 100%;
    height: 100%;
  }
}
</style>
