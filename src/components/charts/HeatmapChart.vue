<script setup lang="ts">
import { ref, onMounted, watch, nextTick, computed } from 'vue';
import * as d3 from 'd3';
import { format } from 'date-fns';
import type { HeatmapCell } from '@/types';
import { useDrillDownStore } from '@/stores/drillDown';
import { dataAdapter } from '@/api/adapter';
import { getClosedDateReason } from '@/utils/dateHelper';
import { CLOSED_DATES } from '@/mock/dataGenerator';

const props = defineProps<{
  data: HeatmapCell[];
  width?: number;
  height?: number;
}>();

const drillDownStore = useDrillDownStore();
const containerRef = ref<HTMLElement | null>(null);
const tooltipRef = ref<HTMLElement | null>(null);

const colorScale = d3.scaleSequential()
  .domain([0, 1])
  .interpolator(d3.interpolateViridis);

const hours = Array.from({ length: 14 }, (_, i) => i + 7);

const uniqueDates = computed(() => {
  const dates = [...new Set(props.data.map(d => format(d.date, 'yyyy-MM-dd')))];
  return dates.sort();
});

async function handleCellClick(cell: HeatmapCell) {
  if (cell.isClosed) return;
  const records = await dataAdapter.getRawRecords(cell.date, cell.hour);
  drillDownStore.open(
    `${format(cell.date, 'yyyy-MM-dd')} ${cell.hour}:00 时段详情`,
    cell,
    records
  );
}

function renderChart() {
  if (!containerRef.value || props.data.length === 0) return;
  
  const container = containerRef.value;
  container.innerHTML = '';
  
  const width = props.width || container.clientWidth;
  const height = props.height || 500;
  const margin = { top: 40, right: 30, bottom: 60, left: 100 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;
  
  const svg = d3.select(container)
    .append('svg')
    .attr('width', width)
    .attr('height', height);
  
  const g = svg.append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);
  
  const xScale = d3.scaleBand()
    .domain(hours.map(h => `${h}:00`))
    .range([0, innerWidth])
    .padding(0.05);
  
  const yScale = d3.scaleBand()
    .domain(uniqueDates.value)
    .range([0, innerHeight])
    .padding(0.05);
  
  g.append('g')
    .attr('class', 'x-axis')
    .attr('transform', `translate(0,${innerHeight})`)
    .call(d3.axisBottom(xScale))
    .selectAll('text')
    .attr('class', 'text-xs fill-slate-500')
    .style('font-size', '10px');
  
  g.append('g')
    .attr('class', 'y-axis')
    .call(d3.axisLeft(yScale))
    .selectAll('text')
    .attr('class', 'text-xs fill-slate-500')
    .style('font-size', '10px');
  
  g.selectAll('.x-axis path, .x-axis line, .y-axis path, .y-axis line')
    .attr('stroke', '#e2e8f0');
  
  const cells = g.selectAll('.cell')
    .data(props.data)
    .enter()
    .append('rect')
    .attr('class', 'cell cursor-pointer transition-all duration-200')
    .attr('x', d => xScale(`${d.hour}:00`) || 0)
    .attr('y', d => yScale(format(d.date, 'yyyy-MM-dd')) || 0)
    .attr('width', xScale.bandwidth())
    .attr('height', yScale.bandwidth())
    .attr('rx', 3)
    .attr('fill', d => {
      if (d.isClosed) return '#fef2f2';
      if (d.sampleSize < 20) return '#e5e7eb';
      return colorScale(d.value) as string;
    })
    .attr('stroke', d => d.isClosed ? '#ef4444' : d.sampleSize < 20 ? '#9ca3af' : 'none')
    .attr('stroke-dasharray', d => d.sampleSize < 20 ? '2,2' : 'none')
    .attr('stroke-width', d => d.isClosed ? 2 : 1);
  
  cells.on('mouseover', function(event, d) {
      d3.select(this).attr('opacity', 0.8);
      if (tooltipRef.value) {
        const closedReason = d.isClosed ? getClosedDateReason(d.date, CLOSED_DATES) : null;
        tooltipRef.value.innerHTML = `
          <div class="font-medium text-sm">${format(d.date, 'yyyy-MM-dd')} ${d.hour}:00</div>
          <div class="text-slate-600 mt-1">利用率: ${(d.value * 100).toFixed(1)}%</div>
          <div class="text-slate-600">样本量: ${d.sampleSize}</div>
          ${d.isClosed ? `<div class="text-red-500 font-medium mt-1">临时闭馆: ${closedReason}</div>` : ''}
          ${d.isExamWeek ? `<div class="text-orange-500 font-medium mt-1">考试周</div>` : ''}
          ${d.sampleSize < 20 ? `<div class="text-amber-600 text-xs mt-1">⚠️ 样本量较小，数据仅供参考</div>` : ''}
        `;
        tooltipRef.value.style.display = 'block';
        tooltipRef.value.style.left = `${event.pageX + 10}px`;
        tooltipRef.value.style.top = `${event.pageY - 10}px`;
      }
    })
    .on('mousemove', function(event) {
      if (tooltipRef.value) {
        tooltipRef.value.style.left = `${event.pageX + 10}px`;
        tooltipRef.value.style.top = `${event.pageY - 10}px`;
      }
    })
    .on('mouseout', function() {
      d3.select(this).attr('opacity', 1);
      if (tooltipRef.value) {
        tooltipRef.value.style.display = 'none';
      }
    })
    .on('click', (_, d) => handleCellClick(d));
  
  const legendWidth = 200;
  const legendHeight = 10;
  const legendX = innerWidth - legendWidth;
  const legendY = innerHeight + 40;
  
  const legendScale = d3.scaleLinear()
    .domain([0, 1])
    .range([0, legendWidth]);
  
  const legendAxis = d3.axisBottom(legendScale)
    .ticks(5)
    .tickFormat(d => `${(d as number) * 100}%`);
  
  const legend = svg.append('g')
    .attr('transform', `translate(${margin.left + legendX},${margin.top + legendY})`);
  
  const gradient = svg.append('defs')
    .append('linearGradient')
    .attr('id', 'heatmap-gradient')
    .attr('x1', '0%')
    .attr('x2', '100%');
  
  gradient.selectAll('stop')
    .data(d3.range(0, 1.1, 0.1))
    .enter()
    .append('stop')
    .attr('offset', d => `${d * 100}%`)
    .attr('stop-color', d => colorScale(d) as string);
  
  legend.append('rect')
    .attr('width', legendWidth)
    .attr('height', legendHeight)
    .style('fill', 'url(#heatmap-gradient)')
    .attr('rx', 3);
  
  legend.append('g')
    .attr('transform', `translate(0,${legendHeight})`)
    .call(legendAxis)
    .selectAll('text')
    .style('font-size', '10px')
    .attr('fill', '#64748b');
  
  legend.selectAll('path, line')
    .attr('stroke', '#e2e8f0');
}

onMounted(() => {
  nextTick(() => renderChart());
});

watch(() => props.data, () => {
  nextTick(() => renderChart());
}, { deep: true });
</script>

<template>
  <div class="relative">
    <div ref="containerRef" class="w-full"></div>
    <div 
      ref="tooltipRef" 
      class="fixed hidden bg-white shadow-xl border border-slate-200 rounded-lg px-3 py-2 z-50 pointer-events-none text-sm"
    ></div>
  </div>
</template>
