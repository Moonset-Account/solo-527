<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from 'vue'
import * as d3 from 'd3'

interface PieData {
  label: string
  value: number
  color: string
}

interface Props {
  data: PieData[]
  height?: number
  title?: string
}

const props = withDefaults(defineProps<Props>(), {
  height: 280,
  title: ''
})

const chartRef = ref<HTMLDivElement | null>(null)

function renderChart() {
  if (!chartRef.value || props.data.length === 0) return

  const container = chartRef.value
  const width = container.clientWidth
  const height = props.height
  const radius = Math.min(width, height) / 2 - 40

  d3.select(container).selectAll('svg').remove()

  const svg = d3.select(container)
    .append('svg')
    .attr('width', width)
    .attr('height', height)
    .attr('viewBox', `0 0 ${width} ${height}`)

  const g = svg.append('g')
    .attr('transform', `translate(${width / 2}, ${height / 2})`)

  const pie = d3.pie<PieData>()
    .value(d => d.value)
    .sort(null)

  const arc = d3.arc<d3.PieArcDatum<PieData>>()
    .innerRadius(radius * 0.6)
    .outerRadius(radius)

  const arcs = g.selectAll('.arc')
    .data(pie(props.data))
    .enter()
    .append('g')
    .attr('class', 'arc')

  arcs.append('path')
    .attr('d', arc)
    .attr('fill', d => d.data.color)
    .attr('opacity', 0.9)
    .style('cursor', 'pointer')
    .on('mouseover', function(event, d) {
      d3.select(this)
        .transition()
        .duration(200)
        .attr('opacity', 1)
        .attr('transform', () => {
          const [x, y] = arc.centroid(d)
          return `translate(${x * 0.05}, ${y * 0.05})`
        })
    })
    .on('mouseout', function() {
      d3.select(this)
        .transition()
        .duration(200)
        .attr('opacity', 0.9)
        .attr('transform', 'translate(0, 0)')
    })

  const total = props.data.reduce((sum, d) => sum + d.value, 0)

  g.append('text')
    .attr('text-anchor', 'middle')
    .attr('dy', '-0.5em')
    .attr('fill', '#E2E8F0')
    .attr('font-size', '24px')
    .attr('font-weight', '700')
    .attr('font-family', 'JetBrains Mono, monospace')
    .text(total.toFixed(0))

  g.append('text')
    .attr('text-anchor', 'middle')
    .attr('dy', '1.2em')
    .attr('fill', '#94A3B8')
    .attr('font-size', '12px')
    .text('总能耗 kWh')

  const legend = svg.append('g')
    .attr('transform', `translate(${width - 120}, 20)`)

  props.data.forEach((d, i) => {
    const legendRow = legend.append('g')
      .attr('transform', `translate(0, ${i * 24})`)

    legendRow.append('rect')
      .attr('width', 12)
      .attr('height', 12)
      .attr('rx', 3)
      .attr('fill', d.color)

    legendRow.append('text')
      .attr('x', 20)
      .attr('y', 10)
      .attr('fill', '#CBD5E1')
      .attr('font-size', '12px')
      .text(d.label)

    legendRow.append('text')
      .attr('x', 80)
      .attr('y', 10)
      .attr('fill', '#94A3B8')
      .attr('font-size', '11px')
      .attr('font-family', 'JetBrains Mono, monospace')
      .text(`${((d.value / total) * 100).toFixed(1)}%`)
  })
}

onMounted(() => {
  nextTick(() => {
    renderChart()
  })
})

watch(() => props.data, () => {
  nextTick(() => {
    renderChart()
  })
}, { deep: true })

let resizeObserver: ResizeObserver | null = null

onMounted(() => {
  if (chartRef.value) {
    resizeObserver = new ResizeObserver(() => {
      renderChart()
    })
    resizeObserver.observe(chartRef.value)
  }
})
</script>

<template>
  <div class="w-full">
    <div v-if="title" class="mb-3">
      <h3 class="text-sm font-medium text-slate-300">{{ title }}</h3>
    </div>
    <div ref="chartRef" class="w-full"></div>
  </div>
</template>
