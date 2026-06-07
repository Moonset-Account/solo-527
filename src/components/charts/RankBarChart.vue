<script setup lang="ts">
import { ref, onMounted, watch, nextTick, computed } from 'vue';
import * as d3 from 'd3';
import type { RankItem } from '../../utils/api';
import { ArrowUpDown, TrendingUp, AlertTriangle } from 'lucide-vue-next';

const props = defineProps<{
  data: RankItem[];
  loading?: boolean;
}>();

const emit = defineEmits<{
  (e: 'sortChange', sortBy: 'total' | 'abnormal'): void;
  (e: 'enterpriseClick', enterpriseId: string): void;
}>();

const sortBy = ref<'total' | 'abnormal'>('total');
const chartRef = ref<HTMLElement | null>(null);
const tooltip = ref<{ x: number; y: number; visible: boolean; content: any }>({
  x: 0, y: 0, visible: false, content: null,
});

const sortLabel = computed(() => sortBy.value === 'total' ? '访客总量' : '异常量');

function toggleSort() {
  sortBy.value = sortBy.value === 'total' ? 'abnormal' : 'total';
  emit('sortChange', sortBy.value);
}

function renderChart() {
  if (!chartRef.value || !props.data || props.data.length === 0) return;

  const container = chartRef.value;
  const width = container.clientWidth;
  const barHeight = 32;
  const height = props.data.length * barHeight + 20;
  const margin = { top: 10, right: 60, bottom: 10, left: 120 };
  const innerWidth = width - margin.left - margin.right;

  d3.select(container).selectAll('*').remove();

  const svg = d3
    .select(container)
    .append('svg')
    .attr('width', width)
    .attr('height', height);

  const g = svg.append('g').attr('transform', `translate(${margin.left}, ${margin.top})`);

  const maxTotal = d3.max(props.data, d => d.total) || 1;
  const xScale = d3.scaleLinear()
    .domain([0, maxTotal])
    .range([0, innerWidth]);

  const yScale = d3.scaleBand()
    .domain(props.data.map(d => d.enterpriseId))
    .range([0, props.data.length * barHeight])
    .padding(0.2);

  const colorScale = d3.scaleSequential(d3.interpolateBlues)
    .domain([0, maxTotal]);

  const barGroups = g.selectAll('.bar-group')
    .data(props.data)
    .enter()
    .append('g')
    .attr('class', 'bar-group')
    .attr('transform', d => `translate(0, ${yScale(d.enterpriseId) || 0})`)
    .style('cursor', 'pointer')
    .on('mouseenter', function(event, d) {
      d3.select(this).select('.bar-bg').attr('opacity', 0.8);
      const rect = container.getBoundingClientRect();
      tooltip.value = {
        x: event.clientX - rect.left + 10,
        y: event.clientY - rect.top + 10,
        visible: true,
        content: d,
      };
    })
    .on('mouseleave', function() {
      d3.select(this).select('.bar-bg').attr('opacity', 0.6);
      tooltip.value.visible = false;
    })
    .on('click', (_, d) => emit('enterpriseClick', d.enterpriseId));

  barGroups.append('rect')
    .attr('class', 'bar-bg')
    .attr('x', 0)
    .attr('y', 0)
    .attr('width', d => xScale(d.total))
    .attr('height', yScale.bandwidth())
    .attr('rx', 3)
    .attr('fill', d => colorScale(d.total))
    .attr('opacity', 0.6)
    .style('transition', 'all 0.3s');

  barGroups.append('rect')
    .attr('x', 0)
    .attr('y', 0)
    .attr('width', d => xScale(d.abnormal))
    .attr('height', yScale.bandwidth())
    .attr('rx', 3)
    .attr('fill', '#EF4444')
    .attr('opacity', 0.8);

  barGroups.append('text')
    .attr('x', -10)
    .attr('y', yScale.bandwidth() / 2)
    .attr('dy', '0.35em')
    .attr('text-anchor', 'end')
    .attr('fill', 'var(--color-text-primary)')
    .style('font-size', '12px')
    .style('font-weight', 500)
    .text(d => {
      const name = d.enterpriseName;
      return name.length > 8 ? name.slice(0, 8) + '...' : name;
    });

  barGroups.append('text')
    .attr('x', d => xScale(d.total) + 8)
    .attr('y', yScale.bandwidth() / 2)
    .attr('dy', '0.35em')
    .attr('fill', 'var(--color-text-secondary)')
    .style('font-size', '12px')
    .text(d => d.total.toLocaleString());

  barGroups.filter(d => d.abnormal > 0)
    .append('circle')
    .attr('cx', d => xScale(d.total) - 8)
    .attr('cy', yScale.bandwidth() / 2)
    .attr('r', 4)
    .attr('fill', '#F59E0B');
}

watch(() => props.data, () => {
  nextTick(renderChart);
}, { deep: true });

onMounted(() => {
  nextTick(() => {
    renderChart();
    window.addEventListener('resize', renderChart);
  });
});
</script>

<template>
  <div class="glass-card p-5 h-full flex flex-col">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-base font-semibold flex items-center gap-2">
        <TrendingUp class="w-5 h-5 text-[var(--color-accent-light)]" />
        <span>企业访客排行</span>
      </h3>
      <button
        class="btn-secondary flex items-center gap-1 text-xs py-1 px-2"
        @click="toggleSort"
      >
        <ArrowUpDown class="w-3 h-3" />
        按{{ sortLabel }}
      </button>
    </div>

    <div ref="chartRef" class="chart-container flex-1 min-h-[320px] overflow-y-auto">
      <div v-if="loading" class="absolute inset-0 flex items-center justify-center">
        <div class="animate-pulse text-[var(--color-text-muted)] text-sm">加载中...</div>
      </div>
      <div v-if="tooltip.visible" class="tooltip" :style="{ left: tooltip.x + 'px', top: tooltip.y + 'px' }">
        <div class="font-medium">{{ tooltip.content.enterpriseName }}</div>
        <div class="text-[var(--color-text-secondary)] text-xs mt-1">
          排名: #{{ tooltip.content.rank }}
        </div>
        <div class="flex items-center gap-2 text-xs mt-1">
          <span class="text-[var(--color-accent-light)]">访客: {{ tooltip.content.total }}</span>
          <span class="text-[var(--color-danger)]">异常: {{ tooltip.content.abnormal }}</span>
        </div>
        <div class="text-[var(--color-warning)] text-xs">
          异常率: {{ tooltip.content.abnormalRate }}%
        </div>
      </div>
    </div>

    <div class="mt-3 pt-3 border-t border-[var(--color-border)] flex items-center gap-4 text-xs text-[var(--color-text-muted)]">
      <div class="flex items-center gap-1">
        <span class="w-3 h-3 rounded bg-[var(--color-accent)]"></span>
        <span>访客总量</span>
      </div>
      <div class="flex items-center gap-1">
        <span class="w-3 h-3 rounded bg-[var(--color-danger)]"></span>
        <span>异常量</span>
      </div>
      <div class="flex items-center gap-1">
        <AlertTriangle class="w-3 h-3 text-[var(--color-warning)]" />
        <span>高风险企业</span>
      </div>
    </div>
  </div>
</template>
