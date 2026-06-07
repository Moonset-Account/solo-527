<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from 'vue';
import * as d3 from 'd3';
import type { AreaUtilization } from '@/types';

const props = defineProps<{
  data: AreaUtilization[];
  width?: number;
}>();

const containerRef = ref<HTMLElement | null>(null);

function renderChart() {
  if (!containerRef.value || props.data.length === 0) return;
  
  const container = containerRef.value;
  container.innerHTML = '';
  
  const width = props.width || container.clientWidth;
  const height = 350;
  const margin = { top: 20, right: 30, bottom: 80, left: 60 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;
  
  const svg = d3.select(container)
    .append('svg')
    .attr('width', width)
    .attr('height', height);
  
  const g = svg.append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);
  
  const xScale = d3.scaleBand()
    .domain(props.data.map(d => d.areaName))
    .range([0, innerWidth])
    .padding(0.2);
  
  const yScale = d3.scaleLinear()
    .domain([0, 1])
    .range([innerHeight, 0]);
  
  const colorScale = d3.scaleLinear<string, string>()
    .domain([0, 0.5, 1])
    .range(['#bfdbfe', '#3b82f6', '#1e3a8a']);
  
  g.append('g')
    .attr('class', 'x-axis')
    .attr('transform', `translate(0,${innerHeight})`)
    .call(d3.axisBottom(xScale))
    .selectAll('text')
    .attr('transform', 'rotate(-30)')
    .style('text-anchor', 'end')
    .style('font-size', '11px')
    .attr('fill', '#64748b');
  
  g.append('g')
    .attr('class', 'y-axis')
    .call(d3.axisLeft(yScale).ticks(5).tickFormat(d => `${(d as number) * 100}%`))
    .selectAll('text')
    .style('font-size', '11px')
    .attr('fill', '#64748b');
  
  g.selectAll('.x-axis path, .x-axis line, .y-axis path, .y-axis line')
    .attr('stroke', '#e2e8f0');
  
  g.selectAll('.grid-line')
    .data(yScale.ticks(5))
    .enter()
    .append('line')
    .attr('class', 'grid-line')
    .attr('x1', 0)
    .attr('x2', innerWidth)
    .attr('y1', d => yScale(d))
    .attr('y2', d => yScale(d))
    .attr('stroke', '#f1f5f9')
    .attr('stroke-dasharray', '3,3');
  
  const bars = g.selectAll('.bar')
    .data(props.data)
    .enter()
    .append('rect')
    .attr('class', 'bar cursor-pointer transition-all duration-300')
    .attr('x', d => xScale(d.areaName) || 0)
    .attr('y', innerHeight)
    .attr('width', xScale.bandwidth())
    .attr('height', 0)
    .attr('fill', d => colorScale(d.utilization) as string)
    .attr('rx', 4);
  
  bars.transition()
    .duration(800)
    .ease(d3.easeCubicOut)
    .attr('y', d => yScale(d.utilization))
    .attr('height', d => innerHeight - yScale(d.utilization));
  
  bars.on('mouseover', function(event, d) {
      d3.select(this).attr('opacity', 0.8);
    })
    .on('mouseout', function() {
      d3.select(this).attr('opacity', 1);
    });
  
  g.selectAll('.bar-label')
    .data(props.data)
    .enter()
    .append('text')
    .attr('class', 'bar-label')
    .attr('x', d => (xScale(d.areaName) || 0) + xScale.bandwidth() / 2)
    .attr('y', d => yScale(d.utilization) - 5)
    .attr('text-anchor', 'middle')
    .style('font-size', '11px')
    .attr('fill', '#475569')
    .attr('font-weight', '500')
    .text(d => `${(d.utilization * 100).toFixed(1)}%`);
}

onMounted(() => {
  nextTick(() => renderChart());
});

watch(() => props.data, () => {
  nextTick(() => renderChart());
}, { deep: true });
</script>

<template>
  <div ref="containerRef" class="w-full"></div>
</template>
