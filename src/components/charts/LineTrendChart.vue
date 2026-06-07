<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from 'vue';
import * as d3 from 'd3';
import { format } from 'date-fns';

interface DataPoint {
  date: Date | string;
  value: number;
  label?: string;
}

const props = defineProps<{
  data: DataPoint[];
  width?: number;
  height?: number;
  color?: string;
  showArea?: boolean;
}>();

const containerRef = ref<HTMLElement | null>(null);
const tooltipRef = ref<HTMLElement | null>(null);

function renderChart() {
  if (!containerRef.value || props.data.length === 0) return;
  
  const container = containerRef.value;
  container.innerHTML = '';
  
  const width = props.width || container.clientWidth;
  const height = props.height || 300;
  const margin = { top: 20, right: 30, bottom: 50, left: 60 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;
  
  const svg = d3.select(container)
    .append('svg')
    .attr('width', width)
    .attr('height', height);
  
  const g = svg.append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);
  
  const xScale = d3.scalePoint()
    .domain(props.data.map((d, i) => i.toString()))
    .range([0, innerWidth])
    .padding(0.5);
  
  const yMax = d3.max(props.data, d => d.value) || 1;
  const yScale = d3.scaleLinear()
    .domain([0, yMax * 1.1])
    .range([innerHeight, 0]);
  
  const lineColor = props.color || '#3b82f6';
  
  const line = d3.line<{ d: DataPoint; i: number }>()
    .x(d => xScale(d.i.toString()) || 0)
    .y(d => yScale(d.d.value))
    .curve(d3.curveMonotoneX);
  
  if (props.showArea) {
    const area = d3.area<{ d: DataPoint; i: number }>()
      .x(d => xScale(d.i.toString()) || 0)
      .y0(innerHeight)
      .y1(d => yScale(d.d.value))
      .curve(d3.curveMonotoneX);
    
    const gradient = svg.append('defs')
      .append('linearGradient')
      .attr('id', 'area-gradient')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');
    
    gradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', lineColor)
      .attr('stop-opacity', 0.3);
    
    gradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', lineColor)
      .attr('stop-opacity', 0.05);
    
    g.append('path')
      .datum(props.data.map((d, i) => ({ d, i })))
      .attr('fill', 'url(#area-gradient)')
      .attr('d', area as any);
  }
  
  g.append('path')
    .datum(props.data.map((d, i) => ({ d, i })))
    .attr('fill', 'none')
    .attr('stroke', lineColor)
    .attr('stroke-width', 2.5)
    .attr('d', line as any);
  
  const xTicks = props.data.filter((_, i) => i % Math.ceil(props.data.length / 8) === 0);
  g.append('g')
    .attr('class', 'x-axis')
    .attr('transform', `translate(0,${innerHeight})`)
    .call(d3.axisBottom(d3.scalePoint()
      .domain(xTicks.map((_, i) => i.toString()))
      .range([0, innerWidth]))
      .tickFormat((_, i) => {
        const point = xTicks[i];
        if (point.date instanceof Date) {
          return format(point.date, 'MM-dd');
        }
        return point.date.toString();
      })
    )
    .selectAll('text')
    .style('font-size', '11px')
    .attr('fill', '#64748b');
  
  g.append('g')
    .attr('class', 'y-axis')
    .call(d3.axisLeft(yScale).ticks(5))
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
  
  const circles = g.selectAll('.data-point')
    .data(props.data.map((d, i) => ({ d, i })))
    .enter()
    .append('circle')
    .attr('class', 'data-point cursor-pointer')
    .attr('cx', d => xScale(d.i.toString()) || 0)
    .attr('cy', d => yScale(d.d.value))
    .attr('r', 4)
    .attr('fill', 'white')
    .attr('stroke', lineColor)
    .attr('stroke-width', 2);
  
  circles.on('mouseover', function(event, d) {
      d3.select(this).attr('r', 6);
      if (tooltipRef.value) {
        tooltipRef.value.innerHTML = `
          <div class="text-sm">
            <div class="font-medium">${d.d.label || (d.d.date instanceof Date ? format(d.d.date, 'yyyy-MM-dd') : d.d.date)}</div>
            <div class="text-slate-600">值: ${(d.d.value * 100).toFixed(1)}%</div>
          </div>
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
      d3.select(this).attr('r', 4);
      if (tooltipRef.value) {
        tooltipRef.value.style.display = 'none';
      }
    });
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
      class="fixed hidden bg-white shadow-xl border border-slate-200 rounded-lg px-3 py-2 z-50 pointer-events-none"
    ></div>
  </div>
</template>
