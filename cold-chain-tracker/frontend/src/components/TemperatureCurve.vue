<template>
  <div class="chart-container" ref="containerRef">
    <div class="chart-header">
      <h3 class="chart-title">温度曲线</h3>
      <div class="chart-legend" v-if="probes.length">
        <span v-for="p in probes" :key="p.id" class="legend-item">
          <span class="legend-dot" :style="{ background: p.color }"></span>
          {{ p.id }}
          <span class="calib-dot" :class="p.calibration_status"></span>
        </span>
      </div>
    </div>
    <svg ref="svgRef"></svg>
    <div class="chart-tooltip" ref="tooltipRef" v-show="tooltip.visible">
      <div>{{ tooltip.time }}</div>
      <div v-for="r in tooltip.readings" :key="r.probe">探头{{ r.probe }}: {{ r.temp }}°C</div>
    </div>
    <OriginalRecord
      v-if="showOriginal"
      :record="selectedRecord"
      @close="showOriginal = false"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as d3 from 'd3'
import api from '../utils/api'
import { useFilterStore } from '../stores/filter'
import OriginalRecord from './OriginalRecord.vue'

const props = defineProps({
  scopeType: { type: String, default: 'overall' },
  scopeId: { type: String, default: '' },
  highlightPeriod: { type: Object, default: null }
})

const containerRef = ref(null)
const svgRef = ref(null)
const tooltipRef = ref(null)
const filterStore = useFilterStore()

const chartData = ref([])
const probes = ref([])
const tooltip = ref({ visible: false, time: '', readings: [] })
const showOriginal = ref(false)
const selectedRecord = ref(null)

const colors = ['#60a5fa', '#34d399', '#fbbf24', '#f87171', '#a78bfa', '#fb923c']

let resizeObserver = null
let brushRef = null

const margin = { top: 30, right: 60, bottom: 50, left: 60 }

async function fetchData() {
  try {
    let url = '/temperature-curve'
    const params = { ...filterStore.buildQueryParams() }
    if (props.scopeType === 'vehicle' && props.scopeId) {
      params.vehicle_id = props.scopeId
    } else if (props.scopeType === 'route' && props.scopeId) {
      params.route_id = props.scopeId
    } else if (props.scopeType === 'batch' && props.scopeId) {
      params.box_id = props.scopeId
    }
    const res = await api.get(url, { params })
    chartData.value = res.data || []
    const probeSet = new Set()
    chartData.value.forEach(d => { if (d.probe_id) probeSet.add(d.probe_id) })
    probes.value = [...probeSet].map((id, i) => ({
      id,
      color: colors[i % colors.length],
      calibration_status: chartData.value.find(d => d.probe_id === id)?.status || 'valid'
    }))
  } catch {
    chartData.value = []
  }
}

function drawChart() {
  const container = containerRef.value
  const svgEl = svgRef.value
  if (!container || !svgEl || !chartData.value.length) return

  const width = container.clientWidth
  const height = 320
  const innerW = width - margin.left - margin.right
  const innerH = height - margin.top - margin.bottom

  const svg = d3.select(svgEl).attr('width', width).attr('height', height)
  svg.selectAll('*').remove()

  const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`)

  const parseTime = d3.timeParse('%Y-%m-%dT%H:%M:%S') || d3.timeParse('%Y-%m-%d %H:%M:%S')

  const grouped = {}
  chartData.value.forEach(d => {
    const pid = d.probe_id || 'default'
    if (!grouped[pid]) grouped[pid] = []
    grouped[pid].push({
      ...d,
      timeObj: new Date(d.timestamp || d.recorded_at),
      temp: +d.temperature,
      isAnomaly: d.is_anomaly || d.anomaly || false
    })
  })

  Object.values(grouped).forEach(arr => arr.sort((a, b) => a.timeObj - b.timeObj))

  const allTemps = chartData.value.map(d => +d.temperature)
  const minTemp = Math.floor(d3.min(allTemps) - 3)
  const maxTemp = Math.ceil(d3.max(allTemps) + 3)
  const allTimes = chartData.value.map(d => new Date(d.timestamp || d.recorded_at))

  const xScale = d3.scaleTime()
    .domain(d3.extent(allTimes))
    .range([0, innerW])

  const yScale = d3.scaleLinear()
    .domain([minTemp, maxTemp])
    .range([innerH, 0])

  g.append('g')
    .attr('transform', `translate(0,${innerH})`)
    .call(d3.axisBottom(xScale).ticks(8).tickFormat(d3.timeFormat('%m/%d %H:%M')))
    .selectAll('text').attr('fill', '#94a3b8').attr('transform', 'rotate(-30)').style('text-anchor', 'end')

  g.append('g')
    .call(d3.axisLeft(yScale).tickFormat(d => d + '°C'))
    .selectAll('text').attr('fill', '#94a3b8')

  const thresholds = chartData.value[0]?.thresholds || chartData.value[0]?.temp_range
  if (thresholds) {
    const upper = thresholds.upper || thresholds.max
    const lower = thresholds.lower || thresholds.min
    if (upper != null && lower != null) {
      g.append('rect')
        .attr('x', 0).attr('width', innerW)
        .attr('y', yScale(upper)).attr('height', yScale(lower) - yScale(upper))
        .attr('fill', '#22c55e').attr('opacity', 0.08)

      g.append('line')
        .attr('x1', 0).attr('x2', innerW)
        .attr('y1', yScale(upper)).attr('y2', yScale(upper))
        .attr('stroke', '#22c55e').attr('stroke-dasharray', '5,3').attr('stroke-width', 1)

      g.append('line')
        .attr('x1', 0).attr('x2', innerW)
        .attr('y1', yScale(lower)).attr('y2', yScale(lower))
        .attr('stroke', '#22c55e').attr('stroke-dasharray', '5,3').attr('stroke-width', 1)
    }
  }

  if (props.highlightPeriod) {
    const startX = xScale(new Date(props.highlightPeriod.start))
    const endX = xScale(new Date(props.highlightPeriod.end))
    g.append('rect')
      .attr('x', startX).attr('width', endX - startX)
      .attr('y', 0).attr('height', innerH)
      .attr('fill', '#f87171').attr('opacity', 0.1)
  }

  const probeEntries = Object.entries(grouped)
  probeEntries.forEach(([probeId, data], idx) => {
    const probeInfo = probes.value.find(p => p.id === probeId)
    const color = probeInfo?.color || colors[idx % colors.length]

    const line = d3.line()
      .x(d => xScale(d.timeObj))
      .y(d => yScale(d.temp))
      .curve(d3.curveMonotoneX)

    g.append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', color)
      .attr('stroke-width', 1.5)
      .attr('d', line)

    const anomalies = data.filter(d => d.isAnomaly)
    g.selectAll(`.anomaly-${probeId}`)
      .data(anomalies)
      .join('circle')
      .attr('cx', d => xScale(d.timeObj))
      .attr('cy', d => yScale(d.temp))
      .attr('r', 5)
      .attr('fill', '#ef4444')
      .attr('stroke', '#fff')
      .attr('stroke-width', 1.5)
      .attr('cursor', 'pointer')
      .on('click', (event, d) => {
        selectedRecord.value = d
        showOriginal.value = true
      })
      .on('mouseenter', (event, d) => {
        tooltip.value = {
          visible: true,
          time: d3.timeFormat('%Y-%m-%d %H:%M')(d.timeObj),
          readings: [{ probe: probeId, temp: d.temp.toFixed(1) }]
        }
      })
      .on('mouseleave', () => { tooltip.value.visible = false })
  })

  const brush = d3.brushX()
    .extent([[0, 0], [innerW, innerH]])
    .on('end', function (event) {
      if (!event.selection) return
      const [x0, x1] = event.selection
      const t0 = xScale.invert(x0)
      const t1 = xScale.invert(x1)
      filterStore.setFilter('dateRange', [
        d3.timeFormat('%Y-%m-%d')(t0),
        d3.timeFormat('%Y-%m-%d')(t1)
      ])
    })

  const brushG = g.append('g').attr('class', 'brush').call(brush)
  brushRef = brushG

  g.append('text')
    .attr('x', innerW / 2).attr('y', innerH + 42)
    .attr('text-anchor', 'middle')
    .attr('fill', '#64748b')
    .attr('font-size', 11)
    .text('拖拽选择时间范围')
}

watch(() => filterStore.filterParams, () => { fetchData().then(drawChart) }, { deep: true })
watch(() => props.scopeId, () => { fetchData().then(drawChart) })

onMounted(() => {
  fetchData().then(drawChart)
  resizeObserver = new ResizeObserver(() => drawChart())
  if (containerRef.value) resizeObserver.observe(containerRef.value)
})

onUnmounted(() => {
  if (resizeObserver) resizeObserver.disconnect()
})
</script>
