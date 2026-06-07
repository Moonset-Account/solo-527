<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from 'vue';
import * as d3 from 'd3';
import type { HeatmapPoint } from '../../utils/api';

const props = defineProps<{
  data: HeatmapPoint[];
  loading?: boolean;
}>();

const emit = defineEmits<{
  (e: 'gateClick', gateId: string): void;
}>();

const chartRef = ref<HTMLElement | null>(null);
const tooltip = ref<{ x: number; y: number; visible: boolean; content: any }>({
  x: 0,
  y: 0,
  visible: false,
  content: null,
});

const gateNames = ['东门', '西门', '南门', '北门', '人行A口', '人行B口'];
const gateIds = ['g001', 'g002', 'g003', 'g004', 'g005', 'g006'];
const hours = Array.from({ length: 24 }, (_, i) => i);

function renderChart() {
  if (!chartRef.value || !props.data || props.data.length === 0) return;

  const container = chartRef.value;
  const width = container.clientWidth;
  const height = container.clientHeight;
  const margin = { top: 30, right: 20, bottom: 40, left: 80 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  d3.select(container).selectAll('*').remove();

  const svg = d3
    .select(container)
    .append('svg')
    .attr('width', width)
    .attr('height', height);

  const g = svg.append('g').attr('transform', `translate(${margin.left}, ${margin.top})`);

  const dataMap: Record<string, number> = {};
  for (const d of props.data) {
    dataMap[`${d.gateId}-${d.hour}`] = d.count;
  }

  const maxCount = d3.max(props.data, d => d.count) || 1;

  const xScale = d3.scaleBand()
    .domain(hours.map(String))
    .range([0, innerWidth])
    .padding(0.05);

  const yScale = d3.scaleBand()
    .domain(gateIds)
    .range([0, innerHeight])
    .padding(0.1);

  const colorScale = d3.scaleSequential()
    .domain([0, maxCount])
    .interpolator(d3.interpolateRgbBasis([
      '#1e3a5f',
      '#2563eb',
      '#3b82f6',
      '#f59e0b',
      '#ef4444',
    ]));

  g.selectAll('.cell')
    .data(gateIds.flatMap(gateId =>
      hours.map(hour => ({
        gateId,
        hour,
        count: dataMap[`${gateId}-${hour}`] || 0,
      }))
    ))
    .enter()
    .append('rect')
    .attr('class', 'cell')
    .attr('x', d => xScale(String(d.hour)) || 0)
    .attr('y', d => yScale(d.gateId) || 0)
    .attr('width', xScale.bandwidth())
    .attr('height', yScale.bandwidth())
    .attr('rx', 2)
    .attr('fill', d => colorScale(d.count))
    .attr('opacity', 0.85)
    .style('cursor', 'pointer')
    .style('transition', 'all 0.2s')
    .on('mouseenter', function(event, d) {
      d3.select(this).attr('opacity', 1).attr('transform', 'scale(1.05)');
      const rect = container.getBoundingClientRect();
      tooltip.value = {
        x: event.clientX - rect.left + 10,
        y: event.clientY - rect.top + 10,
        visible: true,
        content: {
          gate: gateNames[gateIds.indexOf(d.gateId)],
          hour: `${d.hour.toString().padStart(2, '0')}:00`,
          count: d.count,
        },
      };
    })
    .on('mousemove', function(event) {
      const rect = container.getBoundingClientRect();
      tooltip.value.x = event.clientX - rect.left + 10;
      tooltip.value.y = event.clientY - rect.top + 10;
    })
    .on('mouseleave', function() {
      d3.select(this).attr('opacity', 0.85).attr('transform', 'scale(1)');
      tooltip.value.visible = false;
    })
    .on('click', (_, d) => emit('gateClick', d.gateId));

  g.append('g')
    .attr('transform', `translate(0, ${innerHeight})`)
    .call(d3.axisBottom(xScale)
      .tickValues(hours.filter((_, i) => i % 3 === 0).map(String))
      .tickFormat(d => `${d}:00`)
    )
    .selectAll('text')
    .style('fill', 'var(--color-text-secondary)')
    .style('font-size', '11px');
  g.selectAll('.domain, .tick line').style('stroke', 'var(--color-border)');

  g.append('g')
    .call(d3.axisLeft(yScale).tickFormat(d => gateNames[gateIds.indexOf(d)]))
    .selectAll('text')
    .style('fill', 'var(--color-text-secondary)')
    .style('font-size', '11px');
  g.selectAll('.domain, .tick line').style('stroke', 'var(--color-border)');

  const legendWidth = 150;
  const legendHeight = 8;
  const legendX = innerWidth - legendWidth;
  const legendY = -20;

  const legend = svg.append('g').attr('transform', `translate(${margin.left + legendX}, ${margin.top + legendY})`);

  const legendScale = d3.scaleLinear().domain([0, maxCount]).range([0, legendWidth]);
  const legendAxis = d3.axisBottom(legendScale).ticks(3).tickFormat(d3.format('d'));

  const defs = svg.append('defs');
  const linearGradient = defs.append('linearGradient').attr('id', 'heatmap-gradient');
  linearGradient.selectAll('stop')
    .data([
      { offset: '0%', color: '#1e3a5f' },
      { offset: '25%', color: '#2563eb' },
      { offset: '50%', color: '#3b82f6' },
      { offset: '75%', color: '#f59e0b' },
      { offset: '100%', color: '#ef4444' },
    ])
    .enter()
    .append('stop')
    .attr('offset', d => d.offset)
    .attr('stop-color', d => d.color);

  legend.append('rect')
    .attr('width', legendWidth)
    .attr('height', legendHeight)
    .style('fill', 'url(#heatmap-gradient)')
    .attr('rx', 2);

  legend.append('g')
    .attr('transform', `translate(0, ${legendHeight})`)
    .call(legendAxis)
    .selectAll('text')
    .style('fill', 'var(--color-text-muted)')
    .style('font-size', '10px');
  legend.selectAll('.domain, .tick line').style('stroke', 'var(--color-border)');
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
  <div class="glass-card p-5 h-full">
    <h3 class="text-base font-semibold mb-4 flex items-center gap-2">
      <span>入口流量热力图</span>
      <span class="text-xs text-[var(--color-text-muted)] font-normal">24小时分布</span>
    </h3>
    <div ref="chartRef" class="chart-container min-h-[280px]">
      <div v-if="loading" class="absolute inset-0 flex items-center justify-center">
        <div class="animate-pulse text-[var(--color-text-muted)] text-sm">加载中...</div>
      </div>
      <div v-if="tooltip.visible" class="tooltip" :style="{ left: tooltip.x + 'px', top: tooltip.y + 'px' }">
        <div class="font-medium">{{ tooltip.content.gate }}</div>
        <div class="text-[var(--color-text-secondary)]">{{ tooltip.content.hour }}</div>
        <div class="text-[var(--color-accent-light)] font-semibold">{{ tooltip.content.count }} 人次</div>
      </div>
    </div>
  </div>
</template>
