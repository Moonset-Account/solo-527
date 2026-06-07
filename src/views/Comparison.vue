<script setup lang="ts">
import { ref, onMounted, watch, nextTick, computed } from 'vue'
import * as d3 from 'd3'
import { BarChart3, RefreshCw, Database, Clock as ClockIcon, Filter } from 'lucide-vue-next'
import { useQualityStore } from '@/stores/quality'
import { useFilterStore } from '@/stores/filter'
import CardContainer from '@/components/layout/CardContainer.vue'
import DimensionFilter from '@/components/filters/DimensionFilter.vue'
import { formatNumber, formatPercent, formatDuration } from '@/utils/format'
import { METRIC_DEFINITIONS } from '@/utils/constants'
import type { DimensionType, MetricKey } from '@/types'

const qualityStore = useQualityStore()
const filterStore = useFilterStore()

const timeRangeText = computed(() => `${filterStore.timeRange.start} ~ ${filterStore.timeRange.end}`)
const dimensionText = computed(() => {
  const dim = dimensions.find(d => d.type === compareDimension.value)
  return dim?.name || '全部'
})

const compareDimension = ref<DimensionType>('channel')
const selectedMetrics = ref<MetricKey[]>(['anomalyRate', 'avgDuration', 'skipRate'])
const chartContainerRef = ref<HTMLDivElement | null>(null)

const dimensions: { type: DimensionType; name: string }[] = [
  { type: 'survey', name: '按问卷对比' },
  { type: 'channel', name: '按渠道对比' },
  { type: 'questionGroup', name: '按题组对比' },
  { type: 'region', name: '按地区对比' },
  { type: 'device', name: '按设备对比' },
]

const displayMetrics = computed(() => {
  return METRIC_DEFINITIONS.filter(m => selectedMetrics.value.includes(m.key))
})

function toggleMetric(key: MetricKey) {
  const idx = selectedMetrics.value.indexOf(key)
  if (idx > -1) {
    if (selectedMetrics.value.length > 1) {
      selectedMetrics.value.splice(idx, 1)
    }
  } else {
    selectedMetrics.value.push(key)
  }
  nextTick(() => drawChart())
}

function changeDimension(type: DimensionType) {
  compareDimension.value = type
  qualityStore.loadComparisonData(type)
  nextTick(() => drawChart())
}

function drawChart() {
  if (!chartContainerRef.value || !qualityStore.comparisonData.length) return

  const container = chartContainerRef.value
  d3.select(container).selectAll('*').remove()

  const width = container.clientWidth || 800
  const height = 380
  const margin = { top: 30, right: 30, bottom: 80, left: 60 }
  const innerWidth = width - margin.left - margin.right
  const innerHeight = height - margin.top - margin.bottom

  const svg = d3.select(container)
    .append('svg')
    .attr('width', width)
    .attr('height', height)

  const g = svg.append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`)

  const data = qualityStore.comparisonData
  const x0 = d3.scaleBand<string>()
    .domain(data.map(d => d.dimensionValue))
    .range([0, innerWidth])
    .padding(0.2)

  const x1 = d3.scaleBand<string>()
    .domain(selectedMetrics.value)
    .range([0, x0.bandwidth()])
    .padding(0.05)

  const maxVal = d3.max(data, d => {
    return d3.max(selectedMetrics.value, k => {
      const v = d.metrics[k] as number
      return k === 'avgDuration' || k === 'totalSamples' || k === 'validSamples' ? v / 100 : v
    })
  }) || 1

  const y = d3.scaleLinear<number, number>()
    .domain([0, maxVal * 1.1])
    .range([innerHeight, 0])
    .nice()

  const colors = ['#06B6D4', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#3B82F6']

  g.append('g')
    .attr('transform', `translate(0,${innerHeight})`)
    .call(d3.axisBottom(x0))
    .selectAll('text')
    .attr('fill', '#94A3B8')
    .attr('font-size', '12px')
    .style('text-anchor', 'end')
    .attr('transform', 'rotate(-25)')

  g.selectAll('.domain, .tick line')
    .attr('stroke', '#475569')

  g.append('g')
    .call(d3.axisLeft(y).ticks(6))
    .selectAll('text')
    .attr('fill', '#94A3B8')
    .attr('font-size', '11px')

  const groups = g.selectAll('.bar-group')
    .data(data)
    .enter()
    .append('g')
    .attr('class', 'bar-group')
    .attr('transform', d => `translate(${x0(d.dimensionValue) || 0}, 0)`)

  groups.selectAll('rect')
    .data(d => selectedMetrics.value.map(k => ({
      key: k,
      value: (d.metrics[k] as number) || 0,
      name: METRIC_DEFINITIONS.find(m => m.key === k)?.name || k,
    })))
    .enter()
    .append('rect')
    .attr('x', d => x1(d.key) || 0)
    .attr('y', d => {
      const normalizedVal = d.key === 'avgDuration' || d.key === 'totalSamples' || d.key === 'validSamples'
        ? d.value / 100 : d.value
      return y(normalizedVal)
    })
    .attr('width', x1.bandwidth())
    .attr('height', d => {
      const normalizedVal = d.key === 'avgDuration' || d.key === 'totalSamples' || d.key === 'validSamples'
        ? d.value / 100 : d.value
      return innerHeight - y(normalizedVal)
    })
    .attr('fill', (_, i) => colors[i % colors.length])
    .attr('rx', 2)
    .attr('opacity', 0.85)
    .style('transition', 'opacity 0.2s')
    .on('mouseenter', function () {
      d3.select(this).attr('opacity', 1)
    })
    .on('mouseleave', function () {
      d3.select(this).attr('opacity', 0.85)
    })

  const legend = g.append('g')
    .attr('class', 'legend')
    .attr('transform', `translate(0, ${innerHeight + 50})`)

  selectedMetrics.value.forEach((key, i) => {
    const def = METRIC_DEFINITIONS.find(m => m.key === key)
    const legendItem = legend.append('g')
      .attr('transform', `translate(${i * 140}, 0)`)

    legendItem.append('rect')
      .attr('width', 12)
      .attr('height', 12)
      .attr('rx', 2)
      .attr('fill', colors[i % colors.length])

    legendItem.append('text')
      .attr('x', 18)
      .attr('y', 10)
      .attr('fill', '#94A3B8')
      .attr('font-size', '11px')
      .text(def?.name || key)
  })
}

onMounted(() => {
  qualityStore.loadComparisonData(compareDimension.value)
  nextTick(() => drawChart())
})
</script>

<template>
  <div class="space-y-6 animate-fade-in">
    <div class="bg-survey-surface border border-survey-border rounded-lg p-4">
      <div class="flex items-center gap-2 mb-3">
        <Database class="w-4 h-4 text-survey-primary" />
        <span class="text-sm font-medium text-survey-text-primary">当前数据口径</span>
      </div>
      <div class="flex flex-wrap gap-6 text-sm">
        <div class="flex items-center gap-2">
          <ClockIcon class="w-4 h-4 text-survey-text-muted" />
          <span class="text-survey-text-muted">时间窗口:</span>
          <span class="text-survey-text-primary font-medium">{{ timeRangeText }}</span>
        </div>
        <div class="flex items-center gap-2">
          <Filter class="w-4 h-4 text-survey-text-muted" />
          <span class="text-survey-text-muted">对比维度:</span>
          <span class="text-survey-secondary font-medium">{{ dimensionText }}</span>
        </div>
        <div class="flex items-center gap-2">
          <Database class="w-4 h-4 text-survey-text-muted" />
          <span class="text-survey-text-muted">数据来源:</span>
          <span class="text-survey-text-primary font-medium">ClickHouse 聚合查询</span>
        </div>
      </div>
    </div>

    <div class="bg-survey-surface border border-survey-border rounded-lg p-4">
      <div class="flex flex-wrap items-center gap-4">
        <div class="flex items-center gap-2">
          <span class="text-sm text-survey-text-muted">对比维度:</span>
          <div class="flex gap-1">
            <button
              v-for="dim in dimensions"
              :key="dim.type"
              @click="changeDimension(dim.type)"
              class="px-3 py-1.5 text-sm rounded-md transition-all"
              :class="compareDimension === dim.type
                ? 'bg-survey-primary text-white'
                : 'bg-survey-bg text-survey-text-secondary hover:bg-survey-surface-hover'"
            >
              {{ dim.name }}
            </button>
          </div>
        </div>
      </div>

      <div class="mt-4 pt-4 border-t border-survey-border/50">
        <div class="flex flex-wrap items-center gap-3">
          <span class="text-sm text-survey-text-muted">对比指标:</span>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="metric in METRIC_DEFINITIONS"
              :key="metric.key"
              @click="toggleMetric(metric.key)"
              class="px-2.5 py-1 text-xs rounded border transition-all"
              :class="selectedMetrics.includes(metric.key)
                ? 'bg-survey-primary/20 text-survey-primary border-survey-primary/50'
                : 'bg-survey-bg text-survey-text-secondary border-survey-border hover:border-survey-primary/30'"
            >
              {{ metric.name }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <CardContainer title="多维对比分析">
      <template #header-actions>
        <button
          @click="drawChart"
          class="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-survey-text-secondary hover:text-survey-text-primary hover:bg-survey-surface-hover rounded transition-colors"
        >
          <RefreshCw class="w-3.5 h-3.5" />
          刷新
        </button>
      </template>
      <div ref="chartContainerRef" class="w-full"></div>
    </CardContainer>

    <CardContainer title="数据明细对比">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-survey-border">
              <th class="text-left py-3 px-4 font-medium text-survey-text-secondary">维度</th>
              <th
                v-for="metric in displayMetrics"
                :key="metric.key"
                class="text-right py-3 px-4 font-medium text-survey-text-secondary"
              >
                {{ metric.name }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="item in qualityStore.comparisonData"
              :key="item.dimensionValue"
              class="border-b border-survey-border/50 hover:bg-survey-surface-hover/50"
            >
              <td class="py-3 px-4 text-survey-text-primary font-medium">{{ item.dimensionValue }}</td>
              <td
                v-for="metric in displayMetrics"
                :key="metric.key"
                class="py-3 px-4 text-right font-mono"
                :class="metric.key === 'anomalyRate' && (item.metrics[metric.key] || 0) > 0.1 ? 'text-survey-danger' : 'text-survey-text-primary'"
              >
                <template v-if="metric.isPercentage">
                  {{ formatPercent((item.metrics[metric.key] as number) || 0) }}
                </template>
                <template v-else-if="metric.key === 'avgDuration'">
                  {{ formatDuration((item.metrics[metric.key] as number) || 0) }}
                </template>
                <template v-else>
                  {{ formatNumber((item.metrics[metric.key] as number) || 0) }}
                </template>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </CardContainer>
  </div>
</template>
