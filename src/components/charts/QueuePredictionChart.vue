<script setup lang="ts">
import { ref, onMounted, watch, onBeforeUnmount } from 'vue';
import * as d3 from 'd3';
import type { QueuePrediction } from '@/types';

interface Props {
  data: QueuePrediction[];
}

const props = defineProps<Props>();
const emit = defineEmits<{
  (e: 'pointClick', point: QueuePrediction): void;
  (e: 'anomalyClick', point: QueuePrediction): void;
}>();

const containerRef = ref<HTMLDivElement | null>(null);
let svg: d3.Selection<SVGSVGElement, unknown, null, undefined> | null = null;
let tooltip: d3.Selection<HTMLDivElement, unknown, HTMLElement, any> | null = null;

function render() {
  if (!containerRef.value || !props.data.length) return;

  const container = containerRef.value;
  const width = container.clientWidth;
  const height = container.clientHeight;
  const margin = { top: 20, right: 20, bottom: 40, left: 50 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  d3.select(container).selectAll('*').remove();

  svg = d3.select(container)
    .append('svg')
    .attr('width', width)
    .attr('height', height);

  const g = svg.append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  const xExtent = d3.extent(props.data, d => new Date(d.timestamp)) as [Date, Date];
  const yMax = d3.max(props.data, d => d.upperBound) || 100;

  const xScale = d3.scaleTime()
    .domain(xExtent)
    .range([0, innerWidth]);

  const yScale = d3.scaleLinear()
    .domain([0, yMax * 1.1])
    .range([innerHeight, 0]);

  const xAxis = d3.axisBottom(xScale)
    .ticks(6)
    .tickFormat(d => d3.timeFormat('%H:%M')(d as Date));

  const yAxis = d3.axisLeft(yScale)
    .ticks(5)
    .tickFormat(d => `${d}分钟`);

  g.append('g')
    .attr('transform', `translate(0,${innerHeight})`)
    .call(xAxis)
    .selectAll('text')
    .attr('fill', '#64748b')
    .attr('font-size', '11px');

  g.append('g')
    .call(yAxis)
    .selectAll('text')
    .attr('fill', '#64748b')
    .attr('font-size', '11px');

  g.selectAll('.domain, .tick line')
    .attr('stroke', '#e2e8f0');

  const now = new Date();
  const nowX = xScale(now);
  if (nowX >= 0 && nowX <= innerWidth) {
    g.append('line')
      .attr('x1', nowX)
      .attr('x2', nowX)
      .attr('y1', 0)
      .attr('y2', innerHeight)
      .attr('stroke', '#0f766e')
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '4,4')
      .attr('opacity', 0.6);

    g.append('text')
      .attr('x', nowX + 5)
      .attr('y', 15)
      .attr('fill', '#0f766e')
      .attr('font-size', '10px')
      .attr('font-weight', '600')
      .text('当前时刻');
  }

  const area = d3.area<QueuePrediction>()
    .x(d => xScale(new Date(d.timestamp)))
    .y0(d => yScale(d.lowerBound))
    .y1(d => yScale(d.upperBound))
    .curve(d3.curveMonotoneX);

  g.append('path')
    .datum(props.data)
    .attr('fill', '#0f766e')
    .attr('opacity', 0.12)
    .attr('d', area);

  const linePredicted = d3.line<QueuePrediction>()
    .x(d => xScale(new Date(d.timestamp)))
    .y(d => yScale(d.predictedWait))
    .curve(d3.curveMonotoneX);

  g.append('path')
    .datum(props.data)
    .attr('fill', 'none')
    .attr('stroke', '#0f766e')
    .attr('stroke-width', 2)
    .attr('stroke-dasharray', '6,3')
    .attr('d', linePredicted);

  const actualData = props.data.filter(d => d.actualWait !== undefined);
  if (actualData.length > 0) {
    const lineActual = d3.line<QueuePrediction>()
      .x(d => xScale(new Date(d.timestamp)))
      .y(d => yScale(d.actualWait!))
      .curve(d3.curveMonotoneX);

    g.append('path')
      .datum(actualData)
      .attr('fill', 'none')
      .attr('stroke', '#f59e0b')
      .attr('stroke-width', 2)
      .attr('d', lineActual);
  }

  const circles = g.selectAll('.data-point')
    .data(props.data)
    .enter()
    .append('circle')
    .attr('class', 'data-point')
    .attr('cx', d => xScale(new Date(d.timestamp)))
    .attr('cy', d => yScale(d.predictedWait))
    .attr('r', d => d.isAnomaly ? 7 : 4)
    .attr('fill', d => d.isAnomaly ? '#ef4444' : '#0f766e')
    .attr('stroke', 'white')
    .attr('stroke-width', d => d.isAnomaly ? 2 : 1)
    .attr('cursor', 'pointer')
    .on('mouseenter', function(event, d) {
      d3.select(this).attr('r', d.isAnomaly ? 9 : 6);
      showTooltip(event, d);
    })
    .on('mousemove', function(event) {
      moveTooltip(event);
    })
    .on('mouseleave', function(event, d) {
      d3.select(this).attr('r', d.isAnomaly ? 7 : 4);
      hideTooltip();
    })
    .on('click', function(event, d) {
      if (d.isAnomaly) {
        emit('anomalyClick', d);
      } else {
        emit('pointClick', d);
      }
    });

  const legend = g.append('g')
    .attr('transform', `translate(${innerWidth - 160}, 10)`);

  legend.append('line')
    .attr('x1', 0)
    .attr('x2', 20)
    .attr('y1', 0)
    .attr('y2', 0)
    .attr('stroke', '#0f766e')
    .attr('stroke-width', 2)
    .attr('stroke-dasharray', '6,3');

  legend.append('text')
    .attr('x', 26)
    .attr('y', 4)
    .attr('fill', '#64748b')
    .attr('font-size', '11px')
    .text('预测值 (95%置信)');

  legend.append('line')
    .attr('x1', 0)
    .attr('x2', 20)
    .attr('y1', 20)
    .attr('y2', 20)
    .attr('stroke', '#f59e0b')
    .attr('stroke-width', 2);

  legend.append('text')
    .attr('x', 26)
    .attr('y', 24)
    .attr('fill', '#64748b')
    .attr('font-size', '11px')
    .text('实际值');

  legend.append('circle')
    .attr('cx', 10)
    .attr('cy', 44)
    .attr('r', 5)
    .attr('fill', '#ef4444');

  legend.append('text')
    .attr('x', 26)
    .attr('y', 48)
    .attr('fill', '#64748b')
    .attr('font-size', '11px')
    .text('异常点');

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

function showTooltip(event: MouseEvent, d: QueuePrediction) {
  if (!tooltip) return;
  const time = new Date(d.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  const anomalyText = d.isAnomaly ? '<div style="color: #ef4444; font-weight: 600; margin-top: 4px;">⚠️ 检测为异常点</div>' : '';
  
  tooltip.html(`
    <div style="font-weight: 600; margin-bottom: 8px;">${d.areaName} - ${time}</div>
    <div style="display: flex; justify-content: space-between; gap: 24px; margin-bottom: 4px;">
      <span style="color: #94a3b8;">预测排队</span>
      <span>${d.predictedWait} 分钟</span>
    </div>
    <div style="display: flex; justify-content: space-between; gap: 24px; margin-bottom: 4px;">
      <span style="color: #94a3b8;">置信区间</span>
      <span>${d.lowerBound} ~ ${d.upperBound} 分钟</span>
    </div>
    <div style="display: flex; justify-content: space-between; gap: 24px; margin-bottom: 4px;">
      <span style="color: #94a3b8;">置信度</span>
      <span>${(d.confidence * 100).toFixed(0)}%</span>
    </div>
    ${d.actualWait !== undefined ? `
    <div style="display: flex; justify-content: space-between; gap: 24px; margin-bottom: 4px;">
      <span style="color: #94a3b8;">实际排队</span>
      <span style="color: #f59e0b;">${d.actualWait} 分钟</span>
    </div>
    ` : ''}
    <div style="display: flex; justify-content: space-between; gap: 24px;">
      <span style="color: #94a3b8;">样本量</span>
      <span>${d.sampleSize.toLocaleString()}</span>
    </div>
    ${anomalyText}
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
