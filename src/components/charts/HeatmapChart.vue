<script setup lang="ts">
import { ref, onMounted, watch, onBeforeUnmount } from 'vue';
import * as d3 from 'd3';
import type { HeatmapData, ClosedAreaNotice } from '@/types';

interface Props {
  data: HeatmapData[];
  closedAreas: ClosedAreaNotice[];
  selectedAreaId: string | null;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  (e: 'areaClick', areaId: string): void;
  (e: 'areaHover', area: HeatmapData | null): void;
}>();

const containerRef = ref<HTMLDivElement | null>(null);
let svg: d3.Selection<SVGSVGElement, unknown, null, undefined> | null = null;
let tooltip: d3.Selection<HTMLDivElement, unknown, HTMLElement, any> | null = null;

const colorScale = d3.scaleSequential(d3.interpolateYlOrRd).domain([0, 1]);

function getDensityColor(density: number, isClosed: boolean): string {
  if (isClosed) return '#94a3b8';
  return colorScale(density);
}

function render() {
  if (!containerRef.value || !props.data.length) return;

  const width = containerRef.value.clientWidth;
  const height = containerRef.value.clientHeight;

  d3.select(containerRef.value).selectAll('*').remove();

  svg = d3.select(containerRef.value)
    .append('svg')
    .attr('width', width)
    .attr('height', height)
    .attr('viewBox', `0 0 600 400`)
    .attr('preserveAspectRatio', 'xMidYMid meet');

  const defs = svg.append('defs');
  const glowFilter = defs.append('filter')
    .attr('id', 'glow')
    .attr('x', '-50%')
    .attr('y', '-50%')
    .attr('width', '200%')
    .attr('height', '200%');
  glowFilter.append('feGaussianBlur')
    .attr('stdDeviation', '3')
    .attr('result', 'coloredBlur');
  const feMerge = glowFilter.append('feMerge');
  feMerge.append('feMergeNode').attr('in', 'coloredBlur');
  feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

  const groups = svg.selectAll('.area-group')
    .data(props.data)
    .enter()
    .append('g')
    .attr('class', 'area-group')
    .attr('transform', 'translate(0, 0)');

  groups.each(function(d) {
    const group = d3.select(this);
    const line = d3.line<[number, number]>()
      .x(d => d[0])
      .y(d => d[1])
      .curve(d3.curveCardinalClosed.tension(0.8));

    group.append('path')
      .attr('d', line(d.coordinates) || '')
      .attr('fill', getDensityColor(d.density, d.isClosed))
      .attr('stroke', d.areaId === props.selectedAreaId ? '#0f766e' : '#ffffff')
      .attr('stroke-width', d.areaId === props.selectedAreaId ? 3 : 2)
      .attr('opacity', d.isClosed ? 0.4 : 0.85)
      .attr('cursor', 'pointer')
      .style('transition', 'all 0.2s ease')
      .on('mouseenter', function(event, datum: any) {
        d3.select(this)
          .attr('opacity', 1)
          .attr('filter', 'url(#glow)');
        emit('areaHover', datum as HeatmapData);
        showTooltip(event, datum as HeatmapData);
      })
      .on('mousemove', function(event) {
        moveTooltip(event);
      })
      .on('mouseleave', function() {
        d3.select(this)
          .attr('opacity', d.isClosed ? 0.4 : 0.85)
          .attr('filter', null);
        emit('areaHover', null);
        hideTooltip();
      })
      .on('click', function(event, datum: any) {
        const data = datum as HeatmapData;
        if (!data.isClosed) {
          emit('areaClick', data.areaId);
        }
      });

    const cx = d3.mean(d.coordinates, c => c[0]) || 0;
    const cy = d3.mean(d.coordinates, c => c[1]) || 0;

    group.append('text')
      .attr('x', cx)
      .attr('y', cy)
      .attr('text-anchor', 'middle')
      .attr('dy', '-0.2em')
      .attr('font-size', '12px')
      .attr('font-weight', '600')
      .attr('fill', d.isClosed ? '#64748b' : '#1e293b')
      .attr('pointer-events', 'none')
      .text(d.areaName);

    group.append('text')
      .attr('x', cx)
      .attr('y', cy)
      .attr('text-anchor', 'middle')
      .attr('dy', '1.3em')
      .attr('font-size', '11px')
      .attr('fill', d.isClosed ? '#94a3b8' : '#475569')
      .attr('pointer-events', 'none')
      .text(d.isClosed ? '临时闭园' : `${d.visitorCount}人`);

    if (d.isClosed) {
      const pathNode = group.select('path').node() as SVGPathElement | null;
      const bbox = pathNode?.getBBox();
      if (bbox) {
        group.append('line')
          .attr('x1', bbox.x)
          .attr('y1', bbox.y + bbox.height)
          .attr('x2', bbox.x + bbox.width)
          .attr('y2', bbox.y)
          .attr('stroke', '#64748b')
          .attr('stroke-width', 1.5)
          .attr('stroke-dasharray', '4,4')
          .attr('pointer-events', 'none');
      }
    }
  });

  if (!tooltip) {
    tooltip = d3.select('body')
      .append('div')
      .attr('class', 'heatmap-tooltip')
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

function showTooltip(event: MouseEvent, d: HeatmapData) {
  if (!tooltip) return;
  const capacityPct = d.capacity > 0 ? Math.round((d.visitorCount / d.capacity) * 100) : 0;
  tooltip.html(`
    <div style="font-weight: 600; margin-bottom: 6px; font-size: 13px;">${d.areaName}</div>
    <div style="display: flex; justify-content: space-between; gap: 20px; margin-bottom: 4px;">
      <span style="color: #94a3b8;">当前客流</span>
      <span>${d.visitorCount.toLocaleString()} 人</span>
    </div>
    <div style="display: flex; justify-content: space-between; gap: 20px; margin-bottom: 4px;">
      <span style="color: #94a3b8;">容量占比</span>
      <span>${capacityPct}%</span>
    </div>
    <div style="display: flex; justify-content: space-between; gap: 20px;">
      <span style="color: #94a3b8;">状态</span>
      <span style="color: ${d.isClosed ? '#f59e0b' : '#10b981'};">${d.isClosed ? '临时闭园' : '正常开放'}</span>
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

watch(() => [props.data, props.selectedAreaId], () => {
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
  <div ref="containerRef" class="w-full h-full min-h-[320px]" />
</template>
