<script setup lang="ts">
import { ref, onMounted, watch, onBeforeUnmount } from 'vue';
import * as d3 from 'd3';
import type { ConversionFunnel } from '@/types';

interface Props {
  data: ConversionFunnel[];
}

const props = defineProps<Props>();
const emit = defineEmits<{
  (e: 'stageClick', stage: ConversionFunnel): void;
}>();

const containerRef = ref<HTMLDivElement | null>(null);
let svg: d3.Selection<SVGSVGElement, unknown, null, undefined> | null = null;
let tooltip: d3.Selection<HTMLDivElement, unknown, HTMLElement, any> | null = null;

const COLORS = ['#0f766e', '#14b8a6', '#2dd4bf', '#5eead4'];

function render() {
  if (!containerRef.value || !props.data.length) return;

  const container = containerRef.value;
  const width = container.clientWidth;
  const height = container.clientHeight;
  const margin = { top: 20, right: 20, bottom: 20, left: 20 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  d3.select(container).selectAll('*').remove();

  svg = d3.select(container)
    .append('svg')
    .attr('width', width)
    .attr('height', height);

  const g = svg.append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  const maxCount = d3.max(props.data, d => d.count) || 1;
  const stageHeight = innerHeight / props.data.length;

  props.data.forEach((d, i) => {
    const barWidth = (d.count / maxCount) * innerWidth * 0.9;
    const x = (innerWidth - barWidth) / 2;
    const y = i * stageHeight + 10;
    const h = stageHeight - 20;

    const group = g.append('g')
      .attr('cursor', 'pointer')
      .on('mouseenter', function(event) {
        d3.select(this).select('rect').attr('opacity', 0.85);
        showTooltip(event, d);
      })
      .on('mousemove', moveTooltip)
      .on('mouseleave', function() {
        d3.select(this).select('rect').attr('opacity', 1);
        hideTooltip();
      })
      .on('click', () => emit('stageClick', d));

    group.append('rect')
      .attr('x', x)
      .attr('y', y)
      .attr('width', barWidth)
      .attr('height', h)
      .attr('fill', COLORS[i % COLORS.length])
      .attr('rx', 6)
      .style('transition', 'all 0.2s');

    group.append('text')
      .attr('x', innerWidth / 2)
      .attr('y', y + h / 2 - 8)
      .attr('text-anchor', 'middle')
      .attr('fill', 'white')
      .attr('font-size', '13px')
      .attr('font-weight', '600')
      .text(d.stageLabel);

    group.append('text')
      .attr('x', innerWidth / 2)
      .attr('y', y + h / 2 + 12)
      .attr('text-anchor', 'middle')
      .attr('fill', 'rgba(255,255,255,0.9)')
      .attr('font-size', '11px')
      .text(`${d.count.toLocaleString()} 人  (${(d.conversionRate * 100).toFixed(0)}% 转化)`);

    if (i < props.data.length - 1) {
      g.append('text')
        .attr('x', innerWidth / 2)
        .attr('y', y + h + 14)
        .attr('text-anchor', 'middle')
        .attr('fill', '#94a3b8')
        .attr('font-size', '10px')
        .text(`↓ ${(props.data[i + 1].conversionRate * 100).toFixed(1)}%`);
    }
  });

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

function showTooltip(event: MouseEvent, d: ConversionFunnel) {
  if (!tooltip) return;
  tooltip.html(`
    <div style="font-weight: 600; margin-bottom: 8px;">${d.stageLabel}</div>
    <div style="display: flex; justify-content: space-between; gap: 24px; margin-bottom: 4px;">
      <span style="color: #94a3b8;">人数</span>
      <span>${d.count.toLocaleString()} 人</span>
    </div>
    <div style="display: flex; justify-content: space-between; gap: 24px; margin-bottom: 4px;">
      <span style="color: #94a3b8;">转化率</span>
      <span>${(d.conversionRate * 100).toFixed(1)}%</span>
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
