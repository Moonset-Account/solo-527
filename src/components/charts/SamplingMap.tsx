import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { MapPin, Info, Layers } from 'lucide-react';
import { WaterQualityRecord, SamplingPoint } from '@/types';
import { RIVER_SECTIONS, SAMPLING_POINTS } from '@/data/mockData';
import { STATUS_COLORS, WATER_QUALITY_GRADES } from '@/data/indicators';
import { useChartInteractionStore } from '@/store/useChartInteractionStore';
import { getSectionById, getAgencyById } from '@/utils/dataProcessing';
import { EmptyState } from '../common/EmptyState';

interface SamplingMapProps {
  records: WaterQualityRecord[];
  loading?: boolean;
}

interface TooltipData {
  x: number;
  y: number;
  point: SamplingPoint;
  latestRecord?: WaterQualityRecord;
  status: 'normal' | 'warning' | 'exceed';
}

export const SamplingMap: React.FC<SamplingMapProps> = ({ records, loading = false }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  
  const { selectedPointId, setSelectedPointId } = useChartInteractionStore();

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || loading) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = 380;
    const padding = 40;

    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height);

    svg.selectAll('*').remove();

    const allLats = SAMPLING_POINTS.map(p => p.lat);
    const allLngs = SAMPLING_POINTS.map(p => p.lng);
    const minLat = Math.min(...allLats) - 0.02;
    const maxLat = Math.max(...allLats) + 0.02;
    const minLng = Math.min(...allLngs) - 0.02;
    const maxLng = Math.max(...allLngs) + 0.02;

    const xScale = d3.scaleLinear()
      .domain([minLng, maxLng])
      .range([padding, width - padding]);

    const yScale = d3.scaleLinear()
      .domain([minLat, maxLat])
      .range([height - padding, padding]);

    const defs = svg.append('defs');
    
    const gradient = defs.append('radialGradient')
      .attr('id', 'waterGradient')
      .attr('cx', '50%')
      .attr('cy', '50%')
      .attr('r', '70%');
    gradient.append('stop').attr('offset', '0%').attr('stop-color', '#e0f2fe');
    gradient.append('stop').attr('offset', '100%').attr('stop-color', '#bae6fd');

    const riverGroup = svg.append('g');
    
    RIVER_SECTIONS.forEach(section => {
      const pathData = section.coordinates
        .map(([lng, lat], i) => `${i === 0 ? 'M' : 'L'} ${xScale(lng)} ${yScale(lat)}`)
        .join(' ');
      
      riverGroup.append('path')
        .attr('d', pathData)
        .attr('fill', 'none')
        .attr('stroke', 'url(#waterGradient)')
        .attr('stroke-width', 12)
        .attr('stroke-linecap', 'round')
        .attr('opacity', 0.6);
      
      riverGroup.append('path')
        .attr('d', pathData)
        .attr('fill', 'none')
        .attr('stroke', '#38bdf8')
        .attr('stroke-width', 3)
        .attr('stroke-linecap', 'round')
        .attr('opacity', 0.8);

      const midIdx = Math.floor(section.coordinates.length / 2);
      const midCoord = section.coordinates[midIdx];
      riverGroup.append('text')
        .attr('x', xScale(midCoord[0]))
        .attr('y', yScale(midCoord[1]) - 15)
        .attr('text-anchor', 'middle')
        .attr('fill', '#0369a1')
        .style('font-size', '11px')
        .style('font-weight', '500')
        .text(section.name);
    });

    const getPointStatus = (pointId: string): 'normal' | 'warning' | 'exceed' => {
      const pointRecords = records.filter(r => r.pointId === pointId && !r.isMissing);
      if (pointRecords.length === 0) return 'normal';
      if (pointRecords.some(r => r.status === 'exceed')) return 'exceed';
      if (pointRecords.some(r => r.status === 'warning')) return 'warning';
      return 'normal';
    };

    const getLatestRecord = (pointId: string): WaterQualityRecord | undefined => {
      return records
        .filter(r => r.pointId === pointId && !r.isMissing)
        .sort((a, b) => new Date(b.sampleTime).getTime() - new Date(a.sampleTime).getTime())[0];
    };

    const pointsGroup = svg.append('g');
    
    SAMPLING_POINTS.forEach(point => {
      const status = getPointStatus(point.id);
      const latestRecord = getLatestRecord(point.id);
      const isSelected = selectedPointId === point.id;

      const g = pointsGroup.append('g')
        .attr('cursor', 'pointer')
        .on('mouseenter', function(event) {
          const [x, y] = d3.pointer(event);
          d3.select(this).select('circle').transition().attr('r', isSelected ? 12 : 10);
          setTooltip({ x, y, point, latestRecord, status });
        })
        .on('mouseleave', function() {
          d3.select(this).select('circle').transition().attr('r', isSelected ? 10 : 7);
          setTooltip(null);
        })
        .on('click', () => {
          setSelectedPointId(isSelected ? null : point.id);
        });

      if (status === 'exceed') {
        g.append('circle')
          .attr('cx', xScale(point.lng))
          .attr('cy', yScale(point.lat))
          .attr('r', 15)
          .attr('fill', STATUS_COLORS.exceed)
          .attr('opacity', 0.2)
          .append('animate')
          .attr('attributeName', 'r')
          .attr('values', '12;20;12')
          .attr('dur', '2s')
          .attr('repeatCount', 'indefinite');
      }

      g.append('circle')
        .attr('cx', xScale(point.lng))
        .attr('cy', yScale(point.lat))
        .attr('r', isSelected ? 10 : 7)
        .attr('fill', STATUS_COLORS[status])
        .attr('stroke', '#fff')
        .attr('stroke-width', isSelected ? 3 : 2)
        .attr('class', 'transition-all duration-200');

      g.append('text')
        .attr('x', xScale(point.lng))
        .attr('y', yScale(point.lat) + 20)
        .attr('text-anchor', 'middle')
        .attr('fill', '#374151')
        .style('font-size', '10px')
        .text(point.name.length > 6 ? point.name.substring(0, 6) + '...' : point.name);
    });

  }, [records, selectedPointId, loading]);

  if (loading) {
    return (
      <div ref={containerRef} className="bg-white rounded-xl border border-zinc-200 p-4">
        <EmptyState type="loading" />
      </div>
    );
  }

  return (
    <div ref={containerRef} className="bg-white rounded-xl border border-zinc-200 p-4 relative">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h3 className="font-semibold text-zinc-900">采样点分布图</h3>
        </div>
        <div className="flex items-center gap-1 text-xs text-zinc-500">
          <Layers size={14} />
          <span>点击采样点查看详情</span>
        </div>
      </div>

      <svg ref={svgRef} className="w-full bg-sky-50/50 rounded-lg" />
      
      <div className="flex items-center justify-center gap-6 mt-3 pt-3 border-t border-zinc-100">
        {WATER_QUALITY_GRADES.slice(0, 3).map(grade => (
          <div key={grade.grade} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: grade.color }} />
            <span className="text-xs text-zinc-600">{grade.grade}类</span>
          </div>
        ))}
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: STATUS_COLORS.normal }} />
          <span className="text-xs text-zinc-600">正常</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: STATUS_COLORS.warning }} />
          <span className="text-xs text-zinc-600">预警</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: STATUS_COLORS.exceed }} />
          <span className="text-xs text-zinc-600">超标</span>
        </div>
      </div>

      {tooltip && (
        <div 
          className="absolute z-20 bg-white rounded-lg shadow-xl border border-zinc-200 p-3 pointer-events-none"
          style={{ left: tooltip.x + 20, top: tooltip.y - 20 }}
        >
          <div className="flex items-center gap-2 mb-2">
            <MapPin size={14} className="text-blue-600" />
            <span className="font-semibold text-zinc-900 text-sm">{tooltip.point.name}</span>
          </div>
          <div className="space-y-1 text-xs">
            <p className="text-zinc-500">
              河段: {getSectionById(tooltip.point.sectionId)?.name || '-'}
            </p>
            <p className="text-zinc-500">
              类型: {tooltip.point.type === 'auto' ? '自动监测站' : '人工采样点'}
            </p>
            <p className="text-zinc-500">
              机构: {getAgencyById(tooltip.point.agencyId)?.name || '-'}
            </p>
            {tooltip.latestRecord && (
              <div className="pt-1 mt-1 border-t border-zinc-100">
                <p className="text-zinc-500">最新数据状态:</p>
                <span 
                  className="inline-block px-2 py-0.5 rounded-full text-white text-xs mt-1"
                  style={{ backgroundColor: STATUS_COLORS[tooltip.status] }}
                >
                  {tooltip.status === 'normal' ? '正常' : tooltip.status === 'warning' ? '预警' : '超标'}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="mt-3 pt-3 border-t border-zinc-100">
        <p className="text-xs text-zinc-500 flex items-start gap-1">
          <Info size={12} className="mt-0.5 flex-shrink-0" />
          <span>地图展示各采样点空间分布及实时状态；呼吸动效标识存在超标记录的点位；点击采样点可过滤趋势图数据。</span>
        </p>
      </div>
    </div>
  );
};
