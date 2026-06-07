import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Info, Layers } from 'lucide-react';
import { WaterQualityRecord, IndicatorKey, SampleType } from '@/types';
import { INDICATOR_STANDARDS, INDICATOR_COLORS, SAMPLE_TYPE_LABELS, STATUS_COLORS } from '@/data/indicators';
import { useChartInteractionStore } from '@/store/useChartInteractionStore';
import { getPointById, formatDateTime } from '@/utils/dataProcessing';
import { MetricTooltip } from '../common/MetricTooltip';
import { EmptyState } from '../common/EmptyState';

interface TrendChartProps {
  records: WaterQualityRecord[];
  selectedIndicators: IndicatorKey[];
  loading?: boolean;
}

interface TooltipData {
  x: number;
  y: number;
  record: WaterQualityRecord;
  indicator: IndicatorKey;
}

export const TrendChart: React.FC<TrendChartProps> = ({ records, selectedIndicators, loading = false }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const [showManual, setShowManual] = useState(true);
  const [showAuto, setShowAuto] = useState(true);
  
  const { selectedPointId, setSelectedPointId, setHighlightedTime } = useChartInteractionStore();

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || loading || records.length === 0) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = 400;
    const margin = { top: 20, right: 80, bottom: 60, left: 60 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height);

    svg.selectAll('*').remove();

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const filteredRecords = records.filter(r => {
      if (r.sampleType === 'manual' && !showManual) return false;
      if (r.sampleType === 'auto' && !showAuto) return false;
      if (selectedPointId && r.pointId !== selectedPointId) return false;
      return true;
    });

    if (filteredRecords.length === 0) return;

    const parseTime = d3.timeParse('%Y-%m-%dT%H:%M:%S');
    const xScale = d3.scaleTime()
      .domain(d3.extent(filteredRecords, d => parseTime(d.sampleTime)!) as [Date, Date])
      .range([0, innerWidth]);

    const yDomains: Record<IndicatorKey, [number, number]> = {
      temperature: [0, 40],
      ph: [5, 10],
      dissolvedOxygen: [0, 15],
      ammoniaNitrogen: [0, 5]
    };

    const primaryIndicator = selectedIndicators[0];
    const yScale = d3.scaleLinear()
      .domain(yDomains[primaryIndicator] || [0, 100])
      .range([innerHeight, 0])
      .nice();

    const xAxis = d3.axisBottom(xScale)
      .ticks(8)
      .tickFormat(d3.timeFormat('%m-%d') as any);

    const yAxis = d3.axisLeft(yScale)
      .ticks(6);

    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .attr('class', 'text-zinc-500')
      .call(xAxis)
      .selectAll('text')
      .style('font-size', '11px');

    g.append('g')
      .attr('class', 'text-zinc-500')
      .call(yAxis)
      .selectAll('text')
      .style('font-size', '11px');

    g.append('g')
      .attr('class', 'grid')
      .selectAll('line')
      .data(yScale.ticks(6))
      .enter()
      .append('line')
      .attr('x1', 0)
      .attr('x2', innerWidth)
      .attr('y1', d => yScale(d))
      .attr('y2', d => yScale(d))
      .attr('stroke', '#e2e8f0')
      .attr('stroke-dasharray', '2,2');

    const std = INDICATOR_STANDARDS[primaryIndicator].standard;
    if (std.min !== null) {
      g.append('line')
        .attr('x1', 0)
        .attr('x2', innerWidth)
        .attr('y1', yScale(std.min))
        .attr('y2', yScale(std.min))
        .attr('stroke', STATUS_COLORS.warning)
        .attr('stroke-dasharray', '4,4')
        .attr('stroke-width', 1.5);
      g.append('text')
        .attr('x', innerWidth + 5)
        .attr('y', yScale(std.min) + 4)
        .attr('fill', STATUS_COLORS.warning)
        .style('font-size', '10px')
        .text(`下限 ${std.min}`);
    }
    if (std.max !== null) {
      g.append('line')
        .attr('x1', 0)
        .attr('x2', innerWidth)
        .attr('y1', yScale(std.max))
        .attr('y2', yScale(std.max))
        .attr('stroke', STATUS_COLORS.exceed)
        .attr('stroke-dasharray', '4,4')
        .attr('stroke-width', 1.5);
      g.append('text')
        .attr('x', innerWidth + 5)
        .attr('y', yScale(std.max) - 4)
        .attr('fill', STATUS_COLORS.exceed)
        .style('font-size', '10px')
        .text(`上限 ${std.max}`);
    }

    const sampleTypes: SampleType[] = [];
    if (showAuto) sampleTypes.push('auto');
    if (showManual) sampleTypes.push('manual');

    selectedIndicators.forEach((indicator, idx) => {
      const color = INDICATOR_COLORS[indicator];
      const indicatorYScale = idx === 0 ? yScale : d3.scaleLinear()
        .domain(yDomains[indicator] || [0, 100])
        .range([innerHeight, 0])
        .nice();

      sampleTypes.forEach(sampleType => {
        const typeRecords = filteredRecords
          .filter(r => r.sampleType === sampleType)
          .filter(r => r[indicator] !== null && !r.isMissing)
          .sort((a, b) => parseTime(a.sampleTime)!.getTime() - parseTime(b.sampleTime)!.getTime());

        if (typeRecords.length === 0) return;

        const line = d3.line<WaterQualityRecord>()
          .x(d => xScale(parseTime(d.sampleTime)!))
          .y(d => indicatorYScale(d[indicator] as number))
          .defined(d => !d.isMissing && d[indicator] !== null)
          .curve(d3.curveMonotoneX);

        const path = g.append('path')
          .datum(typeRecords)
          .attr('fill', 'none')
          .attr('stroke', color)
          .attr('stroke-width', sampleType === 'auto' ? 2 : 1.5)
          .attr('stroke-dasharray', sampleType === 'manual' ? '5,3' : 'none')
          .attr('opacity', selectedIndicators.length > 1 ? 0.7 : 1)
          .attr('d', line);

        const totalLength = path.node()?.getTotalLength() || 0;
        path.attr('stroke-dashoffset', totalLength)
          .attr('stroke-dasharray', sampleType === 'manual' ? `5,3, ${totalLength}` : totalLength)
          .transition()
          .duration(800)
          .attr('stroke-dashoffset', 0)
          .attr('stroke-dasharray', sampleType === 'manual' ? '5,3' : 'none');

        g.selectAll(`.dot-${indicator}-${sampleType}`)
          .data(typeRecords.filter(d => d.status === 'exceed'))
          .enter()
          .append('circle')
          .attr('class', `dot-${indicator}-${sampleType}`)
          .attr('cx', d => xScale(parseTime(d.sampleTime)!))
          .attr('cy', d => indicatorYScale(d[indicator] as number))
          .attr('r', 0)
          .attr('fill', STATUS_COLORS.exceed)
          .attr('stroke', '#fff')
          .attr('stroke-width', 2)
          .style('cursor', 'pointer')
          .on('mouseenter', function(event, d) {
            d3.select(this).transition().attr('r', 7);
            const [x, y] = d3.pointer(event);
            setTooltip({ x: x + margin.left, y: y + margin.top, record: d, indicator });
          })
          .on('mouseleave', function() {
            d3.select(this).transition().attr('r', 5);
            setTooltip(null);
          })
          .on('click', (_, d) => {
            setSelectedPointId(d.pointId);
            setHighlightedTime(d.sampleTime);
          })
          .transition()
          .delay(800)
          .attr('r', 5);

        const missingRecords = filteredRecords
          .filter(r => r.sampleType === sampleType && r.isMissing);
        
        g.selectAll(`.missing-${indicator}-${sampleType}`)
          .data(missingRecords)
          .enter()
          .append('circle')
          .attr('class', `missing-${indicator}-${sampleType}`)
          .attr('cx', d => xScale(parseTime(d.sampleTime)!))
          .attr('cy', innerHeight - 10)
          .attr('r', 4)
          .attr('fill', 'none')
          .attr('stroke', '#94a3b8')
          .attr('stroke-width', 1.5)
          .append('title')
          .text('该时段无数据');
      });
    });

    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -innerHeight / 2)
      .attr('y', -45)
      .attr('text-anchor', 'middle')
      .attr('fill', '#64748b')
      .style('font-size', '12px')
      .text(`${INDICATOR_STANDARDS[primaryIndicator].name} (${INDICATOR_STANDARDS[primaryIndicator].unit})`);

  }, [records, selectedIndicators, selectedPointId, showManual, showAuto, loading]);

  if (loading) {
    return (
      <div ref={containerRef} className="bg-white rounded-xl border border-zinc-200 p-4">
        <EmptyState type="loading" />
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div ref={containerRef} className="bg-white rounded-xl border border-zinc-200 p-4">
        <EmptyState type="no-results" />
      </div>
    );
  }

  return (
    <div ref={containerRef} className="bg-white rounded-xl border border-zinc-200 p-4 relative">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h3 className="font-semibold text-zinc-900">指标趋势图</h3>
          {selectedIndicators.map(ind => (
            <MetricTooltip key={ind} indicator={ind} />
          ))}
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs">
            <Layers size={14} className="text-zinc-500" />
            <label className="flex items-center gap-1 cursor-pointer">
              <input
                type="checkbox"
                checked={showAuto}
                onChange={e => setShowAuto(e.target.checked)}
                className="rounded text-blue-600"
              />
              <span className="text-zinc-600">自动站</span>
            </label>
            <label className="flex items-center gap-1 cursor-pointer">
              <input
                type="checkbox"
                checked={showManual}
                onChange={e => setShowManual(e.target.checked)}
                className="rounded text-blue-600"
              />
              <span className="text-zinc-600">人工采样</span>
            </label>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 mb-3 flex-wrap">
        {selectedIndicators.map(ind => (
          <div key={ind} className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: INDICATOR_COLORS[ind] }}
            />
            <span className="text-xs text-zinc-600">{INDICATOR_STANDARDS[ind].name}</span>
          </div>
        ))}
        <div className="flex items-center gap-2">
          <div className="w-6 h-0 border-t-2 border-zinc-400" />
          <span className="text-xs text-zinc-500">自动站(实线)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-0 border-t-2 border-dashed border-zinc-400" />
          <span className="text-xs text-zinc-500">人工采样(虚线)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: STATUS_COLORS.exceed }} />
          <span className="text-xs text-zinc-500">超标点</span>
        </div>
      </div>

      <svg ref={svgRef} className="w-full" />
      
      {tooltip && (
        <div 
          className="absolute z-20 bg-white rounded-lg shadow-xl border border-zinc-200 p-3 pointer-events-none"
          style={{ left: tooltip.x + 15, top: tooltip.y - 10 }}
        >
          <p className="text-xs text-zinc-500 mb-1">
            {getPointById(tooltip.record.pointId)?.name}
          </p>
          <p className="text-xs text-zinc-400 mb-2">
            {formatDateTime(tooltip.record.sampleTime)} · {SAMPLE_TYPE_LABELS[tooltip.record.sampleType]}
          </p>
          <p className="text-sm font-semibold" style={{ color: INDICATOR_COLORS[tooltip.indicator] }}>
            {INDICATOR_STANDARDS[tooltip.indicator].name}: {tooltip.record[tooltip.indicator]} {INDICATOR_STANDARDS[tooltip.indicator].unit}
          </p>
          {tooltip.record.status === 'exceed' && (
            <p className="text-xs text-rose-600 mt-1">⚠ 超出标准限值</p>
          )}
        </div>
      )}

      <div className="mt-3 pt-3 border-t border-zinc-100">
        <p className="text-xs text-zinc-500 flex items-start gap-1">
          <Info size={12} className="mt-0.5 flex-shrink-0" />
          <span>虚线代表人工采样数据，实线代表自动监测站实时数据；空心圆圈表示该时段数据缺测；点击超标点可联动定位到对应采样点。</span>
        </p>
      </div>
    </div>
  );
};
