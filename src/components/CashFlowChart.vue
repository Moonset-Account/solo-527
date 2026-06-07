<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import * as d3 from 'd3'
import { useDataStore } from '@/stores/data'
import type { CashFlowPoint } from '@/types'

const dataStore = useDataStore()

const svgRef = ref<SVGSVGElement | null>(null)
const containerRef = ref<HTMLDivElement | null>(null)

const cashFlow = computed(() => dataStore.cashFlow)

let resizeObserver: ResizeObserver | null = null

const margin = { top: 20, right: 24, bottom: 32, left: 56 }

const ACCENT = '#00C9A7'
const WARN = '#FFB347'
const INFO = '#4ECDC4'
const BASE_900 = '#0D1F2D'
const GRID_COLOR = 'rgba(148,163,184,0.12)'
const LABEL_COLOR = '#64748b'

interface StackRow {
  month: string
  income: number
  expense: number
}

function formatAmount(v: number): string {
  if (v >= 10000) return '¥' + (v / 10000).toFixed(1) + '万'
  return '¥' + v.toLocaleString('zh-CN')
}

function render() {
  if (!svgRef.value || !containerRef.value) return

  const data = cashFlow.value
  if (!data.length) return

  const containerWidth = containerRef.value.clientWidth
  const width = containerWidth
  const height = 300
  const innerW = width - margin.left - margin.right
  const innerH = height - margin.top - margin.bottom

  const svg = d3.select(svgRef.value)
  svg.selectAll('*').remove()
  svg.attr('width', width).attr('height', height)

  const rows: StackRow[] = data.map(d => ({
    month: d.month,
    income: d.income,
    expense: -d.expense,
  }))

  const keys = ['expense', 'income'] as const

  const stack = d3.stack<StackRow, string>()
    .keys(keys)
    .order(d3.stackOrderNone)
    .offset(d3.stackOffsetDiverging)

  const series = stack(rows)

  const x = d3.scalePoint<string>()
    .domain(rows.map(d => d.month))
    .range([0, innerW])
    .padding(0.3)

  const yMin = d3.min(series, s => d3.min(s, d => d[0]))!
  const yMax = d3.max(series, s => d3.max(s, d => d[1]))!
  const y = d3.scaleLinear()
    .domain([yMin, yMax])
    .range([innerH, 0])
    .nice()

  const g = svg.append('g')
    .attr('transform', `translate(${margin.left}, ${margin.top})`)

  g.append('g')
    .attr('transform', `translate(0, ${innerH})`)
    .call(d3.axisBottom(x).tickSize(0).tickPadding(8))
    .call(g => g.select('.domain').remove())
    .selectAll('text')
    .attr('fill', LABEL_COLOR)
    .attr('font-size', '11px')

  g.append('g')
    .call(d3.axisLeft(y)
      .ticks(5)
      .tickSize(-innerW)
      .tickFormat(d => {
        const v = d as number
        if (v === 0) return '0'
        if (Math.abs(v) >= 10000) return (v / 10000).toFixed(0) + '万'
        return v.toLocaleString()
      })
    )
    .call(g => g.select('.domain').remove())
    .call(g => g.selectAll('.tick line').attr('stroke', GRID_COLOR))
    .call(g => g.selectAll('.tick text').attr('fill', LABEL_COLOR).attr('font-size', '11px'))

  const area = d3.area<d3.SeriesPoint<StackRow>>()
    .x(d => x(d.data.month)!)
    .y0(d => y(d[0]))
    .y1(d => y(d[1]))
    .curve(d3.curveMonotoneX)

  const colorMap: Record<string, string> = {
    income: ACCENT,
    expense: WARN,
  }

  g.selectAll('.area')
    .data(series)
    .join('path')
    .attr('class', 'area')
    .attr('d', area as any)
    .attr('fill', d => {
      const c = colorMap[d.key]
      return d.key === 'income'
        ? d3.color(c)!.copy({ opacity: 0.45 }).toString()
        : d3.color(c)!.copy({ opacity: 0.4 }).toString()
    })
    .attr('stroke', d => colorMap[d.key])
    .attr('stroke-width', 1.5)

  const netLine = d3.line<CashFlowPoint>()
    .x(d => x(d.month)!)
    .y(d => y(d.net))
    .curve(d3.curveMonotoneX)

  g.append('path')
    .datum(data)
    .attr('fill', 'none')
    .attr('stroke', INFO)
    .attr('stroke-width', 2)
    .attr('stroke-dasharray', '6,3')
    .attr('d', netLine as any)

  const bisect = (mx: number) => {
    const xPositions = rows.map(d => x(d.month)!)
    let minIdx = 0
    let minDist = Infinity
    xPositions.forEach((xp, i) => {
      const dist = Math.abs(xp - mx)
      if (dist < minDist) {
        minDist = dist
        minIdx = i
      }
    })
    return minIdx
  }

  const tooltip = d3.select(containerRef.value)
    .selectAll('.cf-tooltip')
    .data([0])
    .join('div')
    .attr('class', 'cf-tooltip')

  const hoverLine = g.append('line')
    .attr('stroke', 'rgba(148,163,184,0.3)')
    .attr('stroke-width', 1)
    .attr('stroke-dasharray', '4,3')
    .style('display', 'none')

  const hoverDot = g.append('circle')
    .attr('r', 4)
    .attr('fill', INFO)
    .style('display', 'none')

  const overlay = g.append('rect')
    .attr('width', innerW)
    .attr('height', innerH)
    .attr('fill', 'none')
    .style('pointer-events', 'all')

  overlay
    .on('mouseenter', () => {
      hoverLine.style('display', null)
      hoverDot.style('display', null)
      tooltip.style('display', 'block')
    })
    .on('mousemove', function (event) {
      const [mx] = d3.pointer(event, this as any)
      const idx = bisect(mx)
      const d = data[idx]
      const xPos = x(d.month)!

      hoverLine
        .attr('x1', xPos).attr('x2', xPos)
        .attr('y1', 0).attr('y2', innerH)

      hoverDot
        .attr('cx', xPos)
        .attr('cy', y(d.net))

      const netColor = d.net >= 0 ? ACCENT : '#FF6B6B'

      tooltip
        .style('left', `${event.offsetX + 12}px`)
        .style('top', `${event.offsetY - 16}px`)
        .html(`
          <div style="font-weight:600;color:#fff;margin-bottom:4px">${d.month}</div>
          <div style="color:${ACCENT}">收入: ¥${d.income.toLocaleString()}</div>
          <div style="color:${WARN}">支出: ¥${d.expense.toLocaleString()}</div>
          <div style="color:${netColor}">净额: ¥${d.net.toLocaleString()}</div>
        `)
    })
    .on('mouseleave', () => {
      hoverLine.style('display', 'none')
      hoverDot.style('display', 'none')
      tooltip.style('display', 'none')
    })
}

watch(cashFlow, () => {
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
    <h3 class="text-base font-semibold mb-3" style="color: #e2e8f0;">现金流趋势</h3>
    <div ref="containerRef" style="position: relative; width: 100%;">
      <svg ref="svgRef"></svg>
      <div class="cf-tooltip" style="display:none; position:absolute; pointer-events:none; background:#1a2e3d; border:1px solid #2d4a5e; border-radius:8px; padding:8px 12px; font-size:13px; z-index:10;"></div>
    </div>
    <div class="flex items-center gap-4 mt-2" style="font-size: 12px;">
      <div class="flex items-center gap-1.5">
        <span class="inline-block w-3 h-2 rounded-sm" style="background: rgba(0,201,167,0.45);"></span>
        <span style="color: #94a3b8;">收入</span>
      </div>
      <div class="flex items-center gap-1.5">
        <span class="inline-block w-3 h-2 rounded-sm" style="background: rgba(255,179,71,0.4);"></span>
        <span style="color: #94a3b8;">支出</span>
      </div>
      <div class="flex items-center gap-1.5">
        <span class="inline-block w-3 h-0.5" style="background: #4ECDC4; border-top: 2px dashed #4ECDC4;"></span>
        <span style="color: #94a3b8;">净额</span>
      </div>
    </div>
  </div>
</template>
