<script setup lang="ts">
import { ref, onMounted, watch, onBeforeUnmount } from 'vue';
import * as d3 from 'd3';
import type { TicketAnalysis } from '@/types';

interface Props {
  data: TicketAnalysis[];
}

const props = defineProps<Props>();
const emit = defineEmits<{
  (e: 'ticketClick', ticket: TicketAnalysis): void;
}>();

const containerRef = ref<HTMLDivElement | null>(null);
let svg: d3.Selection<SVGSVGElement, unknown, null, undefined> | null = null;
let tooltip: d3.Selection<HTMLDivElement, unknown, HTMLElement, any> | null = null;

const COLORS = ['#0f766e', '#14b8a6', '#f59e0b', '#8b5cf6', '#ec4899', '#0ea5e9'];

function render() {
  if (!containerRef.value || !props.data.length) return;

  const container = containerRef.value;
  const width = container.clientWidth;
  const height = container.clientHeight;
  const margin = { top: 10, right: 20, bottom: 50, left: 60 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  d3.select(container).selectAll('*').remove();

  svg = d3.select(container)
    .append('svg')
    .attr('width', width)
    .attr('height', height);

  const g = svg.append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  const xScale = d3.scaleBand()
    .domain(props.data.map(d => d.ticketType))
    .range([0, innerWidth])
    .padding(0.3);

  const yMax = d3.max(props.data, d => d.soldCount) || 100;
  const yScale = d3.scaleLinear()
    .domain([0, yMax * 1.15])
    .range([innerHeight, 0]);

  const xAxis = d3.axisBottom(xScale);
  const yAxis = d3.axisLeft(yScale).ticks(5);

  g.append('g')
    .attr('transform', `translate(0,${innerHeight})`)
    .call(xAxis)
    .selectAll('text')
    .attr('fill', '#64748b')
    .attr('font-size', '10px')
    .attr('transform', 'rotate(-20)')
    .style('text-anchor', 'end');

  g.append('g')
    .call(yAxis)
    .selectAll('text')
    .attr('fill', '#64748b')
    .attr('font-size', '11px');

  g.selectAll('.domain, .tick line')
    .attr('stroke', '#e2e8f0');

  const groups = g.selectAll('.bar-group')
    .data(props.data)
    .enter()
    .append('g')
    .attr('class', 'bar-group');

  groups.each(function(d, i) {
    const group = d3.select(this);
    const x = xScale(d.ticketType) || 0;
    const barWidth = xScale.bandwidth() * 0.7;
    const soldH = innerHeight - yScale(d.soldCount);
    const enteredH = innerHeight - yScale(d.enteredCount);

    group.append('rect')
      .attr('x', x)
      .attr('y', yScale(d.soldCount))
      .attr('width', barWidth)
      .attr('height', soldH)
      .attr('fill', COLORS[i % COLORS.length])
      .attr('rx', 4)
      .attr('cursor', 'pointer')
      .style('transition', 'all 0.2s')
      .on('mouseenter', function(event, datum: any) {
        d3.select(this).attr('opacity', 0.8);
        showTooltip(event, datum as TicketAnalysis);
      })
      .on('mousemove', moveTooltip)
      .on('mouseleave', function() {
        d3.select(this).attr('opacity', 1);
        hideTooltip();
      })
      .on('click', (event, datum: any) => emit('ticketClick', datum as TicketAnalysis));

    group.append('rect')
      .attr('x', x)
      .attr('y', yScale(d.enteredCount))
      .attr('width', barWidth)
      .attr('height', enteredH)
      .attr('fill', '#1e293b')
      .attr('opacity', 0.15)
      .attr('rx', 4)
      .attr('pointer-events', 'none');

    group.append('text')
      .attr('x', x + barWidth / 2)
      .attr('y', yScale(d.soldCount) - 5)
      .attr('text-anchor', 'middle')
      .attr('font-size', '10px')
      .attr('font-weight', '600')
      .attr('fill', '#1e293b')
      .text(d.soldCount.toLocaleString());

    group.append('text')
      .attr('x', x + barWidth / 2)
      .attr('y', yScale(d.enteredCount) - 2)
      .attr('text-anchor', 'middle')
      .attr('font-size', '9px')
      .attr('fill', '#64748b')
      .text(`入园${(d.entryRate * 100).toFixed(0)}%`);
  });

  const legend = g.append('g')
    .attr('transform', `translate(${innerWidth - 120}, 5)`);

  legend.append('rect')
    .attr('x', 0)
    .attr('y', 0)
    .attr('width', 12)
    .attr('height', 12)
    .attr('fill', '#0f766e')
    .attr('rx', 2);

  legend.append('text')
    .attr('x', 18)
    .attr('y', 10)
    .attr('fill', '#64748b')
    .attr('font-size', '10px')
    .text('售票数');

  legend.append('rect')
    .attr('x', 0)
    .attr('y', 20)
    .attr('width', 12)
    .attr('height', 12)
    .attr('fill', '#1e293b')
    .attr('opacity', 0.15)
    .attr('rx', 2);

  legend.append('text')
    .attr('x', 18)
    .attr('y', 30)
    .attr('fill', '#64748b')
    .attr('font-size', '10px')
    .text('入园数');

  if (!tooltip) {
    tooltip = d3.select('body')
      .append('div')
      .style('position', 'absolute')
      .style('padding', '10px 14px')
      .style('background', 'rgba(15, 23, 42, 0.95)')
      .style('color', 'white')
      .style('border-radius', '8px')
      .style('font-size', '12px')
      .style('pointer-events', 'none')
      .style('z-index', '1000')
      .style('opacity', '0')
      .style('transition', 'opacity 0.2s');
  }
}

function showTooltip(event: MouseEvent, d: TicketAnalysis) {
  if (!tooltip) return;
  tooltip.html(`
    <div style="font-weight: 600; margin-bottom: 8px;">${d.ticketType}</div>
    <div style="display: flex; justify-content: space-between; gap: 24px; margin-bottom: 4px;">
      <span style="color: #94a3b8;">售票数</span>
      <span>${d.soldCount.toLocaleString()} 张</span>
    </div>
    <div style="display: flex; justify-content: space-between; gap: 24px; margin-bottom: 4px;">
      <span style="color: #94a3b8;">入园数</span>
      <span>${d.enteredCount.toLocaleString()} 人</span>
    </div>
    <div style="display: flex; justify-content: space-between; gap: 24px; margin-bottom: 4px;">
      <span style="color: #94a3b8;">入园率</span>
      <span>${(d.entryRate * 100).toFixed(1)}%</span>
    </div>
    <div style="display: flex; justify-content: space-between; gap: 24px; margin-bottom: 4px;">
      <span style="color: #94a3b8;">客单价</span>
      <span>¥${d.avgSpend.toFixed(2)}</span>
    </div>
    <div style="display: flex; justify-content: space-between; gap: 24px;">
      <span style="color: #94a3b8;">样本量</span>
      <span>${d.sampleSize.toLocaleString()}</span>
    </div>
  `);
  tooltip.style('opacity', '1');
  moveTooltip(event);
}

function moveTooltip(event: MouseEvent) {
  if (!tooltip) return;
  tooltip
    .style('left', (event.pageX + 15) + 'px')
    .style('top', (event.pageY - 10) + 'px');
}

function hideTooltip() {
  if (tooltip) {
    tooltip.style('opacity', '0');
  }
}

function handleResize() {
  render();
}

onMounted(() => {
  render();
  window.addEventListener('resize', handleResize);
});

watch(() => props.data, () => {
  render();
}, { deep: true });

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize);
  if (tooltip) {
    tooltip.remove();
    tooltip = null;
  }
});
</script>

<template>
  <div ref="containerRef" class="w-full h-full min-h-[280px]" />
</template>
