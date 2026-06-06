import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { FunnelData } from '../../types';
import { TrendingDown, ArrowRight } from 'lucide-react';

interface FunnelChartProps {
  data: FunnelData;
  onStepClick?: (stepId: string) => void;
}

const FunnelChart: React.FC<FunnelChartProps> = ({ data, onStepClick }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !data) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const container = svgRef.current.parentElement;
    if (!container) return;

    const width = container.clientWidth;
    const height = 500;
    const margin = { top: 40, right: 180, bottom: 40, left: 40 };

    svg.attr('width', width).attr('height', height);

    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    const maxCount = data.steps[0].count;
    const stepHeight = innerHeight / data.steps.length;
    const minWidth = innerWidth * 0.2;

    const colorScale = d3
      .scaleLinear<string>()
      .domain([0, data.steps.length - 1])
      .range(['#0ea5e9', '#0369a1']);

    const steps = g
      .selectAll('.funnel-step')
      .data(data.steps)
      .enter()
      .append('g')
      .attr('class', 'funnel-step')
      .attr('transform', (_, i) => `translate(0,${i * stepHeight})`)
      .style('cursor', 'pointer')
      .on('click', (_event, d) => {
        onStepClick?.(d.id);
      });

    steps.each(function (d, i) {
      const stepGroup = d3.select(this);
      const nextCount = i < data.steps.length - 1 ? data.steps[i + 1].count : 0;
      const currentWidth = ((d.count / maxCount) * (innerWidth - minWidth)) + minWidth;
      const nextWidth = ((nextCount / maxCount) * (innerWidth - minWidth)) + minWidth;
      const x1 = (innerWidth - currentWidth) / 2;
      const x2 = (innerWidth - nextWidth) / 2;

      const pathData = `
        M ${x1} 5
        L ${x1 + currentWidth} 5
        L ${x2 + nextWidth} ${stepHeight - 5}
        L ${x2} ${stepHeight - 5}
        Z
      `;

      stepGroup
        .append('path')
        .attr('d', pathData)
        .attr('fill', colorScale(i))
        .attr('opacity', 0.85)
        .attr('rx', 8)
        .style('transition', 'opacity 0.2s')
        .on('mouseenter', function () {
          d3.select(this).attr('opacity', 1);
        })
        .on('mouseleave', function () {
          d3.select(this).attr('opacity', 0.85);
        });

      stepGroup
        .append('text')
        .attr('x', innerWidth / 2)
        .attr('y', stepHeight / 2 - 8)
        .attr('text-anchor', 'middle')
        .attr('fill', 'white')
        .attr('font-size', '14px')
        .attr('font-weight', '600')
        .text(d.name);

      stepGroup
        .append('text')
        .attr('x', innerWidth / 2)
        .attr('y', stepHeight / 2 + 14)
        .attr('text-anchor', 'middle')
        .attr('fill', 'rgba(255,255,255,0.9)')
        .attr('font-size', '12px')
        .text(`${d.count.toLocaleString()} 用户 (${d.conversionRate}%)`);
    });

    const annotations = g
      .selectAll('.funnel-annotation')
      .data(data.steps.slice(1))
      .enter()
      .append('g')
      .attr('class', 'funnel-annotation')
      .attr('transform', (_, i) => `translate(${innerWidth + 20},${(i + 0.5) * stepHeight})`);

    annotations
      .append('rect')
      .attr('x', 0)
      .attr('y', -20)
      .attr('width', 150)
      .attr('height', 40)
      .attr('fill', '#f8fafc')
      .attr('stroke', '#e2e8f0')
      .attr('rx', 6);

    annotations
      .append('text')
      .attr('x', 10)
      .attr('y', -2)
      .attr('fill', '#64748b')
      .attr('font-size', '11px')
      .text((d) => `流失率 ${d.dropOffRate}%`);

    annotations
      .append('text')
      .attr('x', 10)
      .attr('y', 14)
      .attr('fill', '#ef4444')
      .attr('font-size', '12px')
      .attr('font-weight', '600')
      .text(function (d, i) {
        const prevCount = data.steps[i].count;
        const lost = prevCount - d.count;
        return `-${lost.toLocaleString()} 人`;
      });
  }, [data, onStepClick]);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">转化漏斗分析</h3>
          <p className="text-sm text-gray-500 mt-1">
            总转化: <span className="font-semibold text-primary-600">{data.overallConversion}%</span>
            <span className="mx-2">·</span>
            起始用户: <span className="font-semibold text-gray-700">{data.totalUsers.toLocaleString()}</span>
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-primary-50 rounded-lg">
          <TrendingDown className="w-4 h-4 text-primary-600" />
          <span className="text-sm font-medium text-primary-700">漏斗视图</span>
        </div>
      </div>
      <svg ref={svgRef} className="w-full" />
      <div className="mt-6 grid grid-cols-3 gap-4">
        {data.steps.slice(0, 3).map((step, idx) => (
          <div key={step.id} className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
              {idx > 0 && <ArrowRight className="w-3 h-3" />}
              {step.name}
            </div>
            <div className="text-xl font-bold text-gray-800">{step.count.toLocaleString()}</div>
            <div className="text-xs text-gray-500 mt-1">
              转化率 {step.conversionRate}% · 上一步流失 {step.dropOffRate}%
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FunnelChart;
