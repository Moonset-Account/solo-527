<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from 'vue';
import * as d3 from 'd3';
import type { TrendPoint } from '../../utils/api';
import { formatDateTime } from '../../utils/desensitize';
import { MessageSquare } from 'lucide-vue-next';

const props = defineProps<{
  data: TrendPoint[];
  loading?: boolean;
}>();

interface ChartDataPoint extends TrendPoint {
  date: Date;
}

const chartRef = ref<HTMLElement | null>(null);
const tooltip = ref<{ x: number; y: number; visible: boolean; content: any }>({
  x: 0, y: 0, visible: false, content: null,
});

function renderChart() {
  if (!chartRef.value || !props.data || props.data.length === 0) return;

  const container = chartRef.value;
  const width = container.clientWidth;
  const height = container.clientHeight;
  const margin = { top: 20, right: 30, bottom: 40, left: 50 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  d3.select(container).selectAll('*').remove();

  const svg = d3
    .select(container)
    .append('svg')
    .attr('width', width)
    .attr('height', height);

  const g = svg.append('g').attr('transform', `translate(${margin.left}, ${margin.top})`);

  const parseTime = d3.isoParse;
  const data: ChartDataPoint[] = props.data.map(d => ({ ...d, date: parseTime(d.time)! }));

  const xScale = d3.scaleTime()
    .domain(d3.extent(data, d => d.date) as [Date, Date])
    .range([0, innerWidth]);

  const maxCount = d3.max(data, d => d.count) || 1;
  const yScale = d3.scaleLinear()
    .domain([0, maxCount * 1.1])
    .range([innerHeight, 0]);

  const normalData = data.filter(d => !d.isMissing);
  const missingSegments: ChartDataPoint[][] = [];
  let currentSegment: ChartDataPoint[] = [];
  for (let i = 0; i < data.length; i++) {
    const d = data[i];
    if (d.isMissing) {
      if (currentSegment.length > 0) {
        const segStart = currentSegment[currentSegment.length - 1];
        const segEnd = data[i + 1];
        const segment: ChartDataPoint[] = [...currentSegment, d];
        if (segEnd) segment.push(segEnd);
        missingSegments.push(segment);
        currentSegment = [];
      }
    } else {
      currentSegment.push(d);
    }
  }

  const area = d3.area<ChartDataPoint>()
    .x(d => xScale(d.date))
    .y0(innerHeight)
    .y1(d => yScale(d.count))
    .curve(d3.curveMonotoneX);

  const line = d3.line<ChartDataPoint>()
    .x(d => xScale(d.date))
    .y(d => yScale(d.count))
    .curve(d3.curveMonotoneX);

  const gradientId = 'trend-gradient';
  const defs = svg.append('defs');
  const gradient = defs.append('linearGradient')
    .attr('id', gradientId)
    .attr('x1', '0%')
    .attr('y1', '0%')
    .attr('x2', '0%')
    .attr('y2', '100%');
  gradient.append('stop').attr('offset', '0%').attr('stop-color', '#3B82F6').attr('stop-opacity', 0.4);
  gradient.append('stop').attr('offset', '100%').attr('stop-color', '#3B82F6').attr('stop-opacity', 0.02);

  g.append('path')
    .datum(normalData)
    .attr('fill', `url(#${gradientId})`)
    .attr('d', area);

  g.append('path')
    .datum(normalData)
    .attr('fill', 'none')
    .attr('stroke', '#3B82F6')
    .attr('stroke-width', 2)
    .attr('d', line);

  for (const seg of missingSegments) {
    if (seg.length >= 2) {
      g.append('path')
        .datum(seg)
        .attr('fill', 'none')
        .attr('stroke', '#64748B')
        .attr('stroke-width', 1.5)
        .attr('stroke-dasharray', '4,4')
        .attr('d', line);
    }
  }

  const abnormalLine = d3.line<ChartDataPoint>()
    .x(d => xScale(d.date))
    .y(d => yScale(d.abnormal))
    .curve(d3.curveMonotoneX);

  g.append('path')
    .datum(normalData)
    .attr('fill', 'none')
    .attr('stroke', '#EF4444')
    .attr('stroke-width', 1.5)
    .attr('opacity', 0.6)
    .attr('d', abnormalLine);

  const peakPoints = g.selectAll('.peak-point')
    .data(data.filter(d => d.isPeak))
    .enter()
    .append('g')
    .attr('class', 'peak-point')
    .attr('transform', d => `translate(${xScale(d.date)}, ${yScale(d.count)})`);

  peakPoints
    .append('circle')
    .attr('r', 5)
    .attr('fill', '#EF4444')
    .attr('stroke', '#fff')
    .attr('stroke-width', 2)
    .style('cursor', 'pointer');

  const remarkPoints = g.selectAll('.remark-point')
    .data(data.filter(d => d.remark))
    .enter()
    .append('g')
    .attr('class', 'remark-point')
    .attr('transform', d => `translate(${xScale(d.date)}, ${yScale(d.count)})`);

  remarkPoints
    .append('text')
    .attr('y', -12)
    .attr('text-anchor', 'middle')
    .attr('fill', '#F59E0B')
    .style('font-size', '12px')
    .text('💬');

  const xAxis = d3.axisBottom(xScale)
    .ticks(6)
    .tickFormat(d => {
      const date = d as Date;
      return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:00`;
    });

  g.append('g')
    .attr('transform', `translate(0, ${innerHeight})`)
    .call(xAxis)
    .selectAll('text')
    .style('fill', 'var(--color-text-secondary)')
    .style('font-size', '11px');
  g.selectAll('.domain, .tick line').style('stroke', 'var(--color-border)');

  g.append('g')
    .call(d3.axisLeft(yScale).ticks(5))
    .selectAll('text')
    .style('fill', 'var(--color-text-secondary)')
    .style('font-size', '11px');
  g.selectAll('.domain, .tick line').style('stroke', 'var(--color-border)');

  const mouseG = g.append('g').attr('class', 'mouse-over-effects');
  const mouseLine = mouseG.append('line')
    .attr('class', 'mouse-line')
    .attr('y1', 0)
    .attr('y2', innerHeight)
    .attr('stroke', 'var(--color-text-muted)')
    .attr('stroke-width', 1)
    .attr('stroke-dasharray', '3,3')
    .style('opacity', 0);

  const bisect = d3.bisector<ChartDataPoint, Date>((d) => d.date).left;

  mouseG.append('rect')
    .attr('width', innerWidth)
    .attr('height', innerHeight)
    .attr('fill', 'none')
    .attr('pointer-events', 'all')
    .on('mouseout', () => {
      mouseLine.style('opacity', 0);
      tooltip.value.visible = false;
    })
    .on('mousemove', function(event) {
      const [mx] = d3.pointer(event);
      const x0 = xScale.invert(mx);
      const i = bisect(data, x0, 1);
      const d0 = data[i - 1];
      const d1 = data[i];
      const d = x0.getTime() - d0.date.getTime() > d1.date.getTime() - x0.getTime() ? d1 : d0;

      mouseLine
        .attr('x1', xScale(d.date))
        .attr('x2', xScale(d.date))
        .style('opacity', 1);

      const rect = container.getBoundingClientRect();
      tooltip.value = {
        x: event.clientX - rect.left + 15,
        y: event.clientY - rect.top - 10,
        visible: true,
        content: {
          time: formatDateTime(d.time),
          count: d.count,
          abnormal: d.abnormal,
          isMissing: d.isMissing,
          isPeak: d.isPeak,
          remark: d.remark,
        },
      };
    });

  const legend = g.append('g').attr('transform', `translate(${innerWidth - 120}, 0)`);
  legend.append('line').attr('x1', 0).attr('y1', 8).attr('x2', 20).attr('y2', 8)
    .attr('stroke', '#3B82F6').attr('stroke-width', 2);
  legend.append('text').attr('x', 25).attr('y', 12).text('访客量')
    .style('fill', 'var(--color-text-secondary)').style('font-size', '11px');

  legend.append('line').attr('x1', 0).attr('y1', 28).attr('x2', 20).attr('y2', 28)
    .attr('stroke', '#EF4444').attr('stroke-width', 2).attr('opacity', 0.6);
  legend.append('text').attr('x', 25).attr('y', 32).text('异常量')
    .style('fill', 'var(--color-text-secondary)').style('font-size', '11px');
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
      <span>时段趋势</span>
      <span class="text-xs text-[var(--color-text-muted)] font-normal">访客量随时间变化</span>
    </h3>
    <div ref="chartRef" class="chart-container min-h-[280px]">
      <div v-if="loading" class="absolute inset-0 flex items-center justify-center">
        <div class="animate-pulse text-[var(--color-text-muted)] text-sm">加载中...</div>
      </div>
      <div v-if="tooltip.visible" class="tooltip" :style="{ left: tooltip.x + 'px', top: tooltip.y + 'px' }">
        <div class="text-[var(--color-text-secondary)] text-xs mb-1">{{ tooltip.content.time }}</div>
        <div class="flex items-center gap-2">
          <span class="w-2 h-2 rounded-full bg-[var(--color-accent)]"></span>
          <span>访客量: <strong class="text-[var(--color-accent-light)]">{{ tooltip.content.count }}</strong></span>
        </div>
        <div class="flex items-center gap-2">
          <span class="w-2 h-2 rounded-full bg-[var(--color-danger)]"></span>
          <span>异常量: <strong class="text-[var(--color-danger)]">{{ tooltip.content.abnormal }}</strong></span>
        </div>
        <div v-if="tooltip.content.isMissing" class="text-[var(--color-warning)] text-xs mt-1">
          ⚠ 数据缺失时段
        </div>
        <div v-if="tooltip.content.isPeak" class="text-[var(--color-danger)] text-xs mt-1">
          🔴 异常峰值
        </div>
        <div v-if="tooltip.content.remark" class="flex items-center gap-1 text-[var(--color-warning)] text-xs mt-1">
          <MessageSquare class="w-3 h-3" />
          {{ tooltip.content.remark }}
        </div>
      </div>
    </div>
  </div>
</template>
