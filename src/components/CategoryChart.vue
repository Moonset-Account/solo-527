<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import * as d3 from 'd3'
import { useDataStore } from '@/stores/data'
import { useFilterStore } from '@/stores/filter'
import type { CategoryBreakdownItem } from '@/types'

const dataStore = useDataStore()
const filterStore = useFilterStore()

const svgRef = ref<SVGSVGElement | null>(null)
const containerRef = ref<HTMLDivElement | null>(null)

const breakdown = computed(() => dataStore.categoryBreakdown)
const selectedCategories = computed(() => filterStore.categories)

const outerRadius = 120
const innerRadius = 70

let resizeObserver: ResizeObserver | null = null

const colorScale = d3.scaleOrdinal<string>().range(d3.schemeTableau10)

function getColor(category: string): string {
  const domain = breakdown.value.map(d => d.category)
  colorScale.domain(domain)
  return colorScale(category) as string
}

function formatAmount(v: number): string {
  return '¥' + v.toLocaleString('zh-CN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

function render() {
  if (!svgRef.value || !containerRef.value) return

  const data = breakdown.value
  if (!data.length) return

  const containerWidth = containerRef.value.clientWidth
  const width = containerWidth
  const height = outerRadius * 2 + 40
  const cx = width / 2
  const cy = height / 2

  const domain = data.map(d => d.category)
  colorScale.domain(domain)

  const svg = d3.select(svgRef.value)
  svg.selectAll('*').remove()
  svg.attr('width', width).attr('height', height)

  const total = d3.sum(data, d => d.amount)

  const pie = d3.pie<CategoryBreakdownItem>()
    .value(d => d.amount)
    .sort(null)
    .padAngle(0.02)

  const arc = d3.arc<d3.PieArcDatum<CategoryBreakdownItem>>()
    .innerRadius(innerRadius)
    .outerRadius(outerRadius)
    .cornerRadius(3)

  const arcHover = d3.arc<d3.PieArcDatum<CategoryBreakdownItem>>()
    .innerRadius(innerRadius)
    .outerRadius(outerRadius + 8)
    .cornerRadius(3)

  const chartGroup = svg.append('g')
    .attr('transform', `translate(${cx}, ${cy})`)

  const tooltip = d3.select(containerRef.value)
    .selectAll('.chart-tooltip')
    .data([0])
    .join('div')
    .attr('class', 'chart-tooltip')

  chartGroup.selectAll('path')
    .data(pie(data))
    .join('path')
    .attr('d', arc as any)
    .attr('fill', d => colorScale(d.data.category) as string)
    .attr('stroke', '#0D1F2D')
    .attr('stroke-width', 1.5)
    .style('cursor', 'pointer')
    .each(function (d) {
      const isSelected = selectedCategories.value.includes(d.data.category)
      if (isSelected) {
        d3.select(this)
          .attr('d', arcHover as any)
          .style('filter', `drop-shadow(0 0 6px ${colorScale(d.data.category)})`)
      }
    })
    .on('mouseenter', function (event, d) {
      d3.select(this)
        .transition()
        .duration(150)
        .attr('d', arcHover as any)
        .style('filter', `drop-shadow(0 0 6px ${colorScale(d.data.category)})`)

      const pct = ((d.data.amount / total) * 100).toFixed(1)
      tooltip
        .style('display', 'block')
        .style('left', `${event.offsetX + 12}px`)
        .style('top', `${event.offsetY - 12}px`)
        .html(`
          <div style="font-weight:600;color:#fff;margin-bottom:4px">${d.data.category}</div>
          <div style="color:#ccc">${formatAmount(d.data.amount)}</div>
          <div style="color:#00C9A7">${pct}%</div>
        `)
    })
    .on('mousemove', function (event) {
      tooltip
        .style('left', `${event.offsetX + 12}px`)
        .style('top', `${event.offsetY - 12}px`)
    })
    .on('mouseleave', function (_event, d) {
      const isSelected = selectedCategories.value.includes(d.data.category)
      d3.select(this)
        .transition()
        .duration(150)
        .attr('d', isSelected ? (arcHover as any) : (arc as any))
        .style('filter', isSelected ? `drop-shadow(0 0 6px ${colorScale(d.data.category)})` : 'none')

      tooltip.style('display', 'none')
    })
    .on('click', function (_event, d) {
      filterStore.toggleCategoryDrilldown(d.data.category)
    })

  chartGroup.append('text')
    .attr('text-anchor', 'middle')
    .attr('dy', '-0.3em')
    .attr('fill', '#94a3b8')
    .attr('font-size', '12px')
    .text('总支出')

  chartGroup.append('text')
    .attr('text-anchor', 'middle')
    .attr('dy', '1.1em')
    .attr('fill', '#fff')
    .attr('font-size', '16px')
    .attr('font-weight', '700')
    .text(formatAmount(total))
}

watch([breakdown, selectedCategories], () => {
  render()
})

onMounted(() => {
  render()
  if (containerRef.value) {
    resizeObserver = new ResizeObserver(() => {
      render()
    })
    resizeObserver.observe(containerRef.value)
  }
})

onUnmounted(() => {
  resizeObserver?.disconnect()
})
</script>

<template>
  <div class="card" style="padding: 16px; position: relative; overflow: hidden;">
    <h3 class="text-base font-semibold mb-3" style="color: #e2e8f0;">分类占比</h3>
    <div ref="containerRef" style="position: relative; width: 100%;">
      <svg ref="svgRef"></svg>
      <div class="chart-tooltip" style="display:none; position:absolute; pointer-events:none; background:#1a2e3d; border:1px solid #2d4a5e; border-radius:8px; padding:8px 12px; font-size:13px; z-index:10;"></div>
    </div>
    <div class="mt-3 flex flex-wrap gap-x-4 gap-y-2">
      <div
        v-for="item in breakdown"
        :key="item.category"
        class="flex items-center gap-1.5 cursor-pointer select-none"
        :class="selectedCategories.includes(item.category) ? 'badge-accent' : 'badge-ghost'"
        style="font-size: 12px; padding: 2px 8px; border-radius: 9999px;"
        @click="filterStore.toggleCategoryDrilldown(item.category)"
      >
        <span
          class="inline-block w-2.5 h-2.5 rounded-full"
          :style="{ backgroundColor: getColor(item.category) }"
        ></span>
        <span style="color: #cbd5e1;">{{ item.category }}</span>
        <span style="color: #64748b;">{{ item.percentage.toFixed(1) }}%</span>
      </div>
    </div>
  </div>
</template>
