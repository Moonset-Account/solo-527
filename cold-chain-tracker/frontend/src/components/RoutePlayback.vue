<template>
  <div class="chart-container" ref="containerRef">
    <div class="chart-header">
      <h3 class="chart-title">路线回放</h3>
      <div class="playback-controls">
        <button class="btn btn-sm" @click="togglePlay">{{ playing ? '⏸ 暂停' : '▶ 播放' }}</button>
        <select v-model="speed" class="speed-select">
          <option value="1">1x</option>
          <option value="2">2x</option>
          <option value="4">4x</option>
          <option value="8">8x</option>
        </select>
        <span class="progress-text">{{ currentIndex }} / {{ routePoints.length }}</span>
      </div>
    </div>
    <svg ref="svgRef"></svg>
    <div class="chart-tooltip" v-show="hoverPoint" :style="tooltipStyle">
      <div v-if="hoverPoint">时间: {{ hoverPoint.time }}</div>
      <div v-if="hoverPoint">温度: {{ hoverPoint.temp }}°C</div>
      <div v-if="hoverPoint?.door_event" class="door-event">🚪 门开启</div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import * as d3 from 'd3'
import api from '../utils/api'

const props = defineProps({ routeId: { type: String, required: true } })

const containerRef = ref(null)
const svgRef = ref(null)
const routePoints = ref([])
const playing = ref(false)
const speed = ref('1')
const currentIndex = ref(0)
const hoverPoint = ref(null)
const tooltipStyle = ref({})

let animationTimer = null
let resizeObserver = null

const margin = { top: 20, right: 20, bottom: 20, left: 20 }

async function fetchData() {
  try {
    const res = await api.get(`/routes/${props.routeId}/playback`)
    routePoints.value = res.data?.playback_points || res.data || []
  } catch {
    routePoints.value = []
  }
}

function getSegmentColor(point) {
  if (point.status === 'exception' || point.is_anomaly) return '#ef4444'
  if (point.status === 'warning') return '#fbbf24'
  return '#22c55e'
}

function drawChart() {
  const container = containerRef.value
  const svgEl = svgRef.value
  if (!container || !svgEl || !routePoints.value.length) return

  const width = container.clientWidth
  const height = 300
  const innerW = width - margin.left - margin.right
  const innerH = height - margin.top - margin.bottom

  const svg = d3.select(svgEl).attr('width', width).attr('height', height)
  svg.selectAll('*').remove()

  const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`)

  const points = routePoints.value
  const lats = points.map(p => +p.location_lat || +p.latitude || +p.lat)
  const lngs = points.map(p => +p.location_lng || +p.longitude || +p.lng)

  const xScale = d3.scaleLinear()
    .domain([d3.min(lngs) - 0.01, d3.max(lngs) + 0.01])
    .range([0, innerW])

  const yScale = d3.scaleLinear()
    .domain([d3.min(lats) - 0.01, d3.max(lats) + 0.01])
    .range([innerH, 0])

  for (let i = 1; i < points.length; i++) {
    const p0 = points[i - 1]
    const p1 = points[i]
    g.append('line')
      .attr('x1', xScale(+p0.location_lng || +p0.longitude || +p0.lng))
      .attr('y1', yScale(+p0.location_lat || +p0.latitude || +p0.lat))
      .attr('x2', xScale(+p1.location_lng || +p1.longitude || +p1.lng))
      .attr('y2', yScale(+p1.location_lat || +p1.latitude || +p1.lat))
      .attr('stroke', getSegmentColor(p1))
      .attr('stroke-width', 3)
      .attr('opacity', 0.6)
  }

  const doorEvents = points.filter(p => p.door_event || p.door_open)
  g.selectAll('.door-marker')
    .data(doorEvents)
    .join('text')
    .attr('x', d => xScale(+d.location_lng || +d.longitude || +d.lng))
    .attr('y', d => yScale(+d.location_lat || +d.latitude || +d.lat) - 10)
    .attr('text-anchor', 'middle')
    .attr('font-size', 14)
    .text('🚪')

  g.selectAll('.route-point')
    .data(points)
    .join('circle')
    .attr('cx', d => xScale(+d.location_lng || +d.longitude || +d.lng))
    .attr('cy', d => yScale(+d.location_lat || +d.latitude || +d.lat))
    .attr('r', 2)
    .attr('fill', '#94a3b8')
    .attr('opacity', 0.3)
    .on('mouseenter', (event, d) => {
      hoverPoint.value = {
        time: d.recorded_at || d.timestamp || d.time,
        temp: (d.temperature || 0).toFixed(1),
        door_event: d.door_event || d.door_open
      }
      const [mx, my] = d3.pointer(event, container)
      tooltipStyle.value = { left: mx + 10 + 'px', top: my + 'px' }
    })
    .on('mouseleave', () => { hoverPoint.value = null })

  const marker = g.append('circle')
    .attr('r', 7)
    .attr('fill', '#3b82f6')
    .attr('stroke', '#fff')
    .attr('stroke-width', 2)
    .attr('cursor', 'pointer')

  function updateMarker() {
    if (!routePoints.value.length || currentIndex.value >= routePoints.value.length) return
    const p = routePoints.value[currentIndex.value]
    marker
      .attr('cx', xScale(+p.location_lng || +p.longitude || +p.lng))
      .attr('cy', yScale(+p.location_lat || +p.latitude || +p.lat))
  }

  function animate() {
    if (!playing.value) return
    currentIndex.value = (currentIndex.value + 1) % routePoints.value.length
    updateMarker()
    const interval = Math.max(50, 500 / parseInt(speed.value))
    animationTimer = setTimeout(animate, interval)
  }

  function togglePlay() {
    playing.value = !playing.value
    if (playing.value) {
      animate()
    } else {
      if (animationTimer) clearTimeout(animationTimer)
    }
  }

  if (routePoints.value.length) updateMarker()

  window.__routePlayback = { togglePlay, updateMarker }
}

watch(() => props.routeId, () => {
  fetchData().then(drawChart)
})

onMounted(() => {
  fetchData().then(drawChart)
  resizeObserver = new ResizeObserver(() => drawChart())
  if (containerRef.value) resizeObserver.observe(containerRef.value)
})

onUnmounted(() => {
  if (resizeObserver) resizeObserver.disconnect()
  if (animationTimer) clearTimeout(animationTimer)
})

function togglePlay() {
  playing.value = !playing.value
  if (playing.value) {
    const interval = Math.max(50, 500 / parseInt(speed.value))
    function step() {
      if (!playing.value) return
      currentIndex.value = (currentIndex.value + 1) % routePoints.value.length
      animationTimer = setTimeout(step, interval)
    }
    step()
  } else {
    if (animationTimer) clearTimeout(animationTimer)
  }
}
</script>
