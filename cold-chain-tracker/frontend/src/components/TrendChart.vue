<template>
  <div class="chart-container" ref="containerRef">
    <div class="chart-header">
      <h3 class="chart-title">温度合规趋势</h3>
      <div class="granularity-switch">
        <button
          v-for="g in granularities"
          :key="g.value"
          :class="['btn-gran', { active: granularity === g.value }]"
          @click="granularity = g.value"
        >{{ g.label }}</button>
      </div>
    </div>
    <svg ref="svgRef"></svg>
    <div class="chart-tooltip" ref="tooltipRef" v-show="tooltip.visible">
      <div>{{ tooltip.date }}</div>
      <div>合规率: {{ tooltip.compliance }}%</div>
      <div>异常数: {{ tooltip.exceptions }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as d3 from 'd3'
import api from '../utils/api'
import { useFilterStore } from '../stores/filter'
import { useDrilldown } from '../composables/useDrilldown'

const props = defineProps({ scope: { type: String, default: 'overall' } })
const emit = defineEmits(['drilldown'])

const containerRef = ref(null)
const svgRef = ref(null)
const tooltipRef = ref(null)
const filterStore = useFilterStore()
const { drillDown } = useDrilldown()

const granularities = [
  { value: 'day', label: '日' },
  { value: 'week', label: '周' },
  { value: 'month', label: '月' }
]
const granularity = ref('day')
const chartData = ref([])

const tooltip = ref({ visible: false, date: '', compliance: '', exceptions: '' })

let resizeObserver = null

const margin = { top: 30, right: 60, bottom: 40, left: 50 }

async function fetchData() {
  try {
    const params = { granularity: granularity.value, ...filterStore.buildQueryParams() }
    const res = await api.get('/trends', { params })
    chartData.value = res.data || []
  } catch {
    chartData.value = []
  }
}

function drawChart() {
  const container = containerRef.value
  const svgEl = svgRef.value
  if (!container || !svgEl || !chartData.value.length) return

  const width = container.clientWidth
  const height = 280
  const innerW = width - margin.left - margin.right
  const innerH = height - margin.top - margin.bottom

  const svg = d3.select(svgEl)
    .attr('width', width)
    .attr('height', height)

  svg.selectAll('*').remove()

  const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`)

  const parseDate = d3.timeParse('%Y-%m-%d')
  const data = chartData.value.map(d => ({
    ...d,
    dateObj: parseDate(d.date) || new Date(d.date)
  })).sort((a, b) => a.dateObj - b.dateObj)

  const xScale = d3.scaleTime()
    .domain(d3.extent(data, d => d.dateObj))
    .range([0, innerW])

  const yCompliance = d3.scaleLinear()
    .domain([0, 100])
    .range([innerH, 0])

  const yExceptions = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.exception_count || 0) || 10])
    .range([innerH, 0])

  g.append('g')
    .attr('transform', `translate(0,${innerH})`)
    .call(d3.axisBottom(xScale).ticks(6).tickFormat(d3.timeFormat('%m/%d')))
    .selectAll('text').attr('fill', '#94a3b8')

  g.append('g')
    .call(d3.axisLeft(yCompliance).ticks(5).tickFormat(d => d + '%'))
    .selectAll('text').attr('fill', '#60a5fa')

  g.append('g')
    .attr('transform', `translate(${innerW},0)`)
    .call(d3.axisRight(yExceptions).ticks(5))
    .selectAll('text').attr('fill', '#f87171')

  g.append('g').attr('class', 'grid')
    .selectAll('line')
    .data(yCompliance.ticks(5))
    .join('line')
    .attr('x1', 0).attr('x2', innerW)
    .attr('y1', d => yCompliance(d)).attr('y2', d => yCompliance(d))
    .attr('stroke', '#1e293b').attr('stroke-dasharray', '3,3')

  const complianceLine = d3.line()
    .x(d => xScale(d.dateObj))
    .y(d => yCompliance(d.compliance_rate || 0))
    .curve(d3.curveMonotoneX)

  g.append('path')
    .datum(data)
    .attr('fill', 'none')
    .attr('stroke', '#60a5fa')
    .attr('stroke-width', 2)
    .attr('d', complianceLine)

  const exceptionLine = d3.line()
    .x(d => xScale(d.dateObj))
    .y(d => yExceptions(d.exception_count || 0))
    .curve(d3.curveMonotoneX)

  g.append('path')
    .datum(data)
    .attr('fill', 'none')
    .attr('stroke', '#f87171')
    .attr('stroke-width', 2)
    .attr('stroke-dasharray', '5,3')
    .attr('d', exceptionLine)

  const bisect = d3.bisector(d => d.dateObj).left

  g.append('rect')
    .attr('width', innerW).attr('height', innerH)
    .attr('fill', 'transparent')
    .on('mousemove', function (event) {
      const [mx] = d3.pointer(event)
      const x0 = xScale.invert(mx)
      const i = bisect(data, x0, 1)
      const d = data[Math.min(i, data.length - 1)]
      if (!d) return
      tooltip.value = {
        visible: true,
        date: d.date,
        compliance: (d.compliance_rate || 0).toFixed(1),
        exceptions: d.exception_count || 0
      }
      const tipEl = tooltipRef.value
      if (tipEl) {
        tipEl.style.left = (margin.left + xScale(d.dateObj) + 10) + 'px'
        tipEl.style.top = (margin.top + 10) + 'px'
      }
    })
    .on('mouseleave', () => { tooltip.value.visible = false })

  g.selectAll('.dot-compliance')
    .data(data)
    .join('circle')
    .attr('cx', d => xScale(d.dateObj))
    .attr('cy', d => yCompliance(d.compliance_rate || 0))
    .attr('r', 4)
    .attr('fill', '#60a5fa')
    .attr('cursor', 'pointer')
    .on('click', (event, d) => {
      if (d.vehicle_id) drillDown('vehicle', d.vehicle_id, d.vehicle_plate || d.vehicle_id)
      emit('drilldown', d)
    })
}

watch(granularity, () => { fetchData().then(drawChart) })
watch(() => filterStore.filterParams, () => { fetchData().then(drawChart) }, { deep: true })

onMounted(() => {
  fetchData().then(drawChart)
  resizeObserver = new ResizeObserver(() => drawChart())
  if (containerRef.value) resizeObserver.observe(containerRef.value)
})

onUnmounted(() => {
  if (resizeObserver) resizeObserver.disconnect()
})
</script>
