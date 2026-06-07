<template>
  <ChartContainer 
    :sample-size="sampleSize" 
    :update-time="lastUpdate"
    :filters="filtersDesc"
  >
    <div ref="chartRef" class="repair-time"></div>
  </ChartContainer>
</template>

<script setup>
import { ref, onMounted, watch, computed, onUnmounted } from 'vue'
import * as d3 from 'd3'
import ChartContainer from '@/components/common/ChartContainer.vue'
import { useDataStore } from '@/stores/dataStore.js'
import { COLORS, SEVERITY_COLORS, createTooltip, showTooltip, hideTooltip } from '@/utils/d3Helpers.js'

const store = useDataStore()
const chartRef = ref(null)
const tooltip = ref(null)

const completedRepairs = computed(() => {
  return store.filteredRepairs.filter(r => r.status === 'completed' && r.repair_hours != null)
})

const sampleSize = computed(() => store.sampleSizes.repairTime)
const lastUpdate = computed(() => store.lastUpdateTime)
const filtersDesc = computed(() => store.activeFiltersDesc)

const faultCodeMeta = computed(() => store.faultCodeMeta)

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

watch(completedRepairs, () => {
  if (svg) renderChart()
}, { deep: true })

function initChart() {
  const container = chartRef.value
  if (!container) return
  
  const width = container.clientWidth
  const height = 280
  const margins = { top: 20, right: 20, bottom: 60, left: 50 }
  
  svg = d3.select(container)
    .append('svg')
    .attr('width', width)
    .attr('height', height)
  
  g = svg.append('g')
    .attr('transform', `translate(${margins.left}, ${margins.top})`)
  
  const innerWidth = width - margins.left - margins.right
  const innerHeight = height - margins.top - margins.bottom
  
  xScale = d3.scaleBand()
    .range([0, innerWidth])
    .padding(0.3)
  
  yScale = d3.scaleLinear()
    .range([innerHeight, 0])
  
  g.append('g')
    .attr('class', 'x-axis')
    .attr('transform', `translate(0, ${innerHeight})`)
  
  g.append('g')
    .attr('class', 'y-axis')
}

function renderChart() {
  if (!g || completedRepairs.value.length === 0) return
  
  const container = chartRef.value
  const width = container.clientWidth
  const height = 280
  const margins = { top: 20, right: 20, bottom: 60, left: 50 }
  const innerWidth = width - margins.left - margins.right
  const innerHeight = height - margins.top - margins.bottom
  
  g.selectAll('.bar').remove()
  g.selectAll('.bar-label').remove()
  
  const byCode = {}
  completedRepairs.value.forEach(r => {
    if (!byCode[r.fault_code]) {
      byCode[r.fault_code] = []
    }
    byCode[r.fault_code].push(r.repair_hours)
  })
  
  const data = Object.entries(byCode).map(([code, hours]) => {
    const meta = faultCodeMeta.value.find(f => f.code === code)
    const sorted = [...hours].sort((a, b) => a - b)
    const q1 = d3.quantile(sorted, 0.25)
    const median = d3.quantile(sorted, 0.5)
    const q3 = d3.quantile(sorted, 0.75)
    const avg = d3.mean(sorted)
    
    return {
      code,
      desc: meta?.desc || code,
      severity: meta?.severity || 'medium',
      count: hours.length,
      min: d3.min(sorted),
      max: d3.max(sorted),
      q1,
      median,
      q3,
      avg
    }
  }).sort((a, b) => b.avg - a.avg).slice(0, 8)
  
  xScale.domain(data.map(d => d.code))
  yScale.domain([0, d3.max(data, d => d.max) * 1.1])
  
  const xAxis = d3.axisBottom(xScale)
  g.select('.x-axis')
    .call(xAxis)
    .selectAll('text')
    .attr('fill', COLORS.text.secondary)
    .attr('font-size', '10px')
    .attr('transform', 'rotate(-30)')
    .style('text-anchor', 'end')
  
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
  
  const bars = g.selectAll('.bar-group')
    .data(data)
    .enter()
    .append('g')
    .attr('class', 'bar-group')
    .attr('transform', d => `translate(${xScale(d.code)}, 0)`)
  
  bars.each(function(d) {
    const gBar = d3.select(this)
    const barWidth = xScale.bandwidth()
    const centerX = barWidth / 2
    
    gBar.append('line')
      .attr('x1', centerX)
      .attr('x2', centerX)
      .attr('y1', yScale(d.min))
      .attr('y2', yScale(d.max))
      .attr('stroke', COLORS.text.muted)
      .attr('stroke-width', 1.5)
    
    gBar.append('rect')
      .attr('x', 2)
      .attr('y', yScale(d.q3))
      .attr('width', barWidth - 4)
      .attr('height', yScale(d.q1) - yScale(d.q3))
      .attr('fill', SEVERITY_COLORS[d.severity] || COLORS.primary)
      .attr('fill-opacity', 0.8)
      .attr('rx', 2)
      .style('cursor', 'pointer')
      .on('mouseover', function(event) {
        d3.select(this).attr('fill-opacity', 1)
        
        const html = `
          <div style="font-weight:600;margin-bottom:6px;color:${COLORS.text.primary}">${d.code} - ${d.desc}</div>
          <div style="margin-bottom:4px">平均耗时: <span style="font-family:monospace;color:${COLORS.primary}">${d.avg.toFixed(1)}h</span></div>
          <div style="margin-bottom:4px">中位数: <span style="font-family:monospace">${d.median.toFixed(1)}h</span></div>
          <div style="margin-bottom:4px">范围: ${d.min.toFixed(1)}h - ${d.max.toFixed(1)}h</div>
          <div>样本量: ${d.count}</div>
        `
        showTooltip(tooltip.value, html, event)
      })
      .on('mousemove', function(event) {
        tooltip.value
          .style('left', (event.pageX + 15) + 'px')
          .style('top', (event.pageY - 10) + 'px')
      })
      .on('mouseout', function() {
        d3.select(this).attr('fill-opacity', 0.8)
        hideTooltip(tooltip.value)
      })
      .on('click', () => {
        store.drillToFaultCode(d.code)
      })
    
    gBar.append('line')
      .attr('x1', 2)
      .attr('x2', barWidth - 2)
      .attr('y1', yScale(d.median))
      .attr('y2', yScale(d.median))
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
  })
}
</script>

<style lang="scss" scoped>
.repair-time {
  width: 100%;
  height: 100%;
  min-height: 280px;
  
  :deep(svg) {
    width: 100%;
    height: 100%;
  }
}
</style>
