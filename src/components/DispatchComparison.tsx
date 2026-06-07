import { useRef, useEffect } from 'react';
import * as d3 from 'd3';
import { useDataStore } from '@/store/dataStore';

const MARGIN = { top: 30, right: 30, bottom: 50, left: 50 };
const COLOR_BEFORE = '#4a6fa5';
const COLOR_AFTER = '#00e5c7';
const COLOR_GAP = '#ff9f43';
const COLOR_GRID = 'rgba(255, 255, 255, 0.05)';
const COLOR_AXIS_TEXT = 'rgba(255, 255, 255, 0.5)';

export default function DispatchComparison() {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const filteredStations = useDataStore((s) => s.filteredStations);
  const filteredDispatches = useDataStore((s) => s.filteredDispatches);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const containerWidth = containerRef.current.clientWidth;
    const containerHeight = containerRef.current.clientHeight || 300;
    const width = containerWidth - MARGIN.left - MARGIN.right;
    const height = containerHeight - MARGIN.top - MARGIN.bottom;

    if (filteredStations.length === 0) return;

    const g = svg
      .attr('width', containerWidth)
      .attr('height', containerHeight)
      .append('g')
      .attr('transform', `translate(${MARGIN.left},${MARGIN.top})`);

    const stationNames = filteredStations.map((s) => s.name);
    const beforeValues = filteredStations.map((s) => s.availableBikes);
    const afterValues = filteredStations.map((s) => s.availableBikesForDispatch);
    const gapValues = filteredStations.map((s) => s.availableBikesForDispatch - s.availableBikes);

    const x0 = d3.scaleBand().domain(stationNames).range([0, width]).padding(0.2);
    const x1 = d3
      .scaleBand()
      .domain(['before', 'after'])
      .range([0, x0.bandwidth()])
      .padding(0.05);

    const allBarValues = [...beforeValues, ...afterValues];
    const yMax = d3.max(allBarValues) ?? 0;
    const y = d3.scaleLinear().domain([0, yMax * 1.15]).range([height, 0]);

    const gapExtent = d3.extent(gapValues) as [number, number];
    const yGap = d3
      .scaleLinear()
      .domain([Math.min(gapExtent[0], 0) * 1.3, Math.max(gapExtent[1], 0) * 1.3])
      .range([height, 0]);

    g.append('g')
      .selectAll('line')
      .data(y.ticks(5))
      .join('line')
      .attr('x1', 0)
      .attr('x2', width)
      .attr('y1', (d) => y(d))
      .attr('y2', (d) => y(d))
      .attr('stroke', COLOR_GRID);

    const xAxis = g
      .append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x0).tickSize(0))
      .call((g) => g.select('.domain').remove());

    xAxis
      .selectAll('text')
      .attr('fill', COLOR_AXIS_TEXT)
      .attr('font-size', '10px')
      .attr('transform', 'rotate(-30)')
      .style('text-anchor', 'end');

    const yAxis = g
      .append('g')
      .call(d3.axisLeft(y).ticks(5).tickSize(0))
      .call((g) => g.select('.domain').remove());

    yAxis.selectAll('text').attr('fill', COLOR_AXIS_TEXT).attr('font-size', '10px');

    const stationGroups = g
      .append('g')
      .selectAll('g')
      .data(filteredStations)
      .join('g')
      .attr('transform', (d) => `translate(${x0(d.name)},0)`);

    stationGroups
      .append('rect')
      .attr('x', x1('before')!)
      .attr('y', (d) => y(d.availableBikes))
      .attr('width', x1.bandwidth())
      .attr('height', (d) => height - y(d.availableBikes))
      .attr('fill', COLOR_BEFORE)
      .attr('rx', 2);

    stationGroups
      .append('rect')
      .attr('x', x1('after')!)
      .attr('y', (d) => y(d.availableBikesForDispatch))
      .attr('width', x1.bandwidth())
      .attr('height', (d) => height - y(d.availableBikesForDispatch))
      .attr('fill', COLOR_AFTER)
      .attr('rx', 2);

    const lineData = filteredStations.map((s, i) => ({
      name: s.name,
      gap: gapValues[i],
    }));

    const lineGen = d3
      .line<typeof lineData[0]>()
      .x((d) => x0(d.name)! + x0.bandwidth() / 2)
      .y((d) => yGap(d.gap))
      .curve(d3.curveMonotoneX);

    g.append('path')
      .datum(lineData)
      .attr('fill', 'none')
      .attr('stroke', COLOR_GAP)
      .attr('stroke-width', 2)
      .attr('d', lineGen);

    g.selectAll('.gap-dot')
      .data(lineData)
      .join('circle')
      .attr('cx', (d) => x0(d.name)! + x0.bandwidth() / 2)
      .attr('cy', (d) => yGap(d.gap))
      .attr('r', 3)
      .attr('fill', COLOR_GAP);

    g.append('g')
      .selectAll('text')
      .data(lineData)
      .join('text')
      .attr('x', (d) => x0(d.name)! + x0.bandwidth() / 2)
      .attr('y', (d) => yGap(d.gap) - 8)
      .attr('text-anchor', 'middle')
      .attr('fill', COLOR_GAP)
      .attr('font-size', '9px')
      .attr('class', 'font-data')
      .text((d) => (d.gap > 0 ? '+' : '') + d.gap);

    const legend = g.append('g').attr('transform', `translate(${width - 200}, -15)`);

    const legendItems = [
      { label: '调度前余量', color: COLOR_BEFORE },
      { label: '调度后余量', color: COLOR_AFTER },
      { label: '供需差趋势', color: COLOR_GAP },
    ];

    legend
      .selectAll('g')
      .data(legendItems)
      .join('g')
      .attr('transform', (_d, i) => `translate(${i * 80},0)`)
      .each(function (d) {
        const lg = d3.select(this);
        lg.append('rect').attr('width', 10).attr('height', 10).attr('rx', 2).attr('fill', d.color);
        lg.append('text')
          .attr('x', 14)
          .attr('y', 9)
          .attr('fill', 'rgba(255,255,255,0.7)')
          .attr('font-size', '10px')
          .text(d.label);
      });
  }, [filteredStations, filteredDispatches]);

  const completedDispatches = filteredDispatches.filter((d) => d.status === 'completed');
  const totalBikesMoved = completedDispatches.reduce((sum, d) => sum + d.bikeCount, 0);
  const avgResponseTime =
    completedDispatches.length > 0
      ? completedDispatches.reduce((sum, d) => {
          const diff = new Date(d.completedTime).getTime() - new Date(d.dispatchTime).getTime();
          return sum + diff / (1000 * 60);
        }, 0) / completedDispatches.length
      : 0;

  if (filteredStations.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-white/40 text-sm">
        暂无调度数据
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="text-white/80 text-sm font-medium mb-2">调度效果对比</div>
      <div className="flex gap-4 mb-3">
        <div className="flex flex-col">
          <span className="text-white/40 text-xs">总调度次数</span>
          <span className="text-white font-data text-lg">{filteredDispatches.length}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-white/40 text-xs">平均响应时间</span>
          <span className="text-white font-data text-lg">{avgResponseTime.toFixed(1)} min</span>
        </div>
        <div className="flex flex-col">
          <span className="text-white/40 text-xs">总调度车辆</span>
          <span className="text-white font-data text-lg">{totalBikesMoved}</span>
        </div>
      </div>
      <div ref={containerRef} className="flex-1 min-h-0" style={{ minHeight: 250 }}>
        <svg ref={svgRef} className="w-full h-full" />
      </div>
    </div>
  );
}
