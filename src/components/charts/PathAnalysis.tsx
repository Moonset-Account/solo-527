import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { PathData } from '../../types';
import { GitBranch, ArrowRight } from 'lucide-react';

interface PathAnalysisProps {
  data: PathData;
}

const PathAnalysis: React.FC<PathAnalysisProps> = ({ data }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !data) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const container = svgRef.current.parentElement;
    if (!container) return;

    const width = container.clientWidth;
    const height = 600;
    const margin = { top: 40, right: 200, bottom: 40, left: 150 };

    svg.attr('width', width).attr('height', height);

    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    const nodeWidth = 20;
    const nodePadding = 15;
    const nodeColors: Record<string, string> = {
      entry: '#22c55e',
      feature: '#3b82f6',
      exit: '#ef4444',
    };

    const nodeMap = new Map(data.nodes.map((n, i) => [n.id, { ...n, index: i }]));

    const columnNodes: string[][] = [
      ['entry'],
      ['dashboard', 'projects', 'team'],
      ['reports', 'files', 'settings'],
      ['integrations', 'billing'],
      ['exit'],
    ];

    const nodePositions = new Map<string, { x: number; y: number; height: number }>();
    const totalValue = data.nodes.reduce((sum, n) => sum + n.value, 0);

    columnNodes.forEach((column, colIdx) => {
      const x = (colIdx / (columnNodes.length - 1)) * innerWidth;
      const columnTotal = column.reduce((sum, id) => {
        const node = nodeMap.get(id);
        return sum + (node?.value || 0);
      }, 0);
      
      let currentY = 0;
      const availableHeight = innerHeight - (column.length - 1) * nodePadding;
      
      column.forEach((nodeId) => {
        const node = nodeMap.get(nodeId);
        if (!node) return;
        
        const nodeHeight = Math.max((node.value / columnTotal) * availableHeight, 30);
        nodePositions.set(nodeId, {
          x,
          y: currentY,
          height: nodeHeight,
        });
        currentY += nodeHeight + nodePadding;
      });
    });

    const linkGroup = g.append('g').attr('class', 'links');

    data.links.forEach((link) => {
      const source = nodePositions.get(link.source);
      const target = nodePositions.get(link.target);
      if (!source || !target) return;

      const sourceX = source.x + nodeWidth;
      const sourceY = source.y + source.height / 2;
      const targetX = target.x;
      const targetY = target.y + target.height / 2;
      const linkWidth = Math.max((link.value / totalValue) * 20, 2);

      const midX = (sourceX + targetX) / 2;

      const path = d3.path();
      path.moveTo(sourceX, sourceY);
      path.bezierCurveTo(midX, sourceY, midX, targetY, targetX, targetY);

      linkGroup
        .append('path')
        .attr('d', path.toString())
        .attr('fill', 'none')
        .attr('stroke', '#94a3b8')
        .attr('stroke-width', linkWidth)
        .attr('stroke-opacity', 0.4)
        .style('transition', 'stroke-opacity 0.2s')
        .on('mouseenter', function () {
          d3.select(this).attr('stroke-opacity', 0.8).attr('stroke', '#3b82f6');
        })
        .on('mouseleave', function () {
          d3.select(this).attr('stroke-opacity', 0.4).attr('stroke', '#94a3b8');
        });
    });

    const nodeGroup = g.append('g').attr('class', 'nodes');

    nodePositions.forEach((pos, nodeId) => {
      const node = nodeMap.get(nodeId);
      if (!node) return;

      const nodeG = nodeGroup
        .append('g')
        .attr('transform', `translate(${pos.x},${pos.y})`)
        .style('cursor', 'pointer');

      nodeG
        .append('rect')
        .attr('width', nodeWidth)
        .attr('height', pos.height)
        .attr('fill', nodeColors[node.category])
        .attr('rx', 3)
        .style('transition', 'opacity 0.2s')
        .on('mouseenter', function () {
          d3.select(this).attr('opacity', 0.8);
        })
        .on('mouseleave', function () {
          d3.select(this).attr('opacity', 1);
        });

      const labelX = node.category === 'entry' ? -10 : nodeWidth + 10;
      const labelAnchor = node.category === 'entry' ? 'end' : 'start';

      nodeG
        .append('text')
        .attr('x', labelX)
        .attr('y', pos.height / 2 - 6)
        .attr('text-anchor', labelAnchor)
        .attr('fill', '#1e293b')
        .attr('font-size', '12px')
        .attr('font-weight', '600')
        .text(node.name);

      nodeG
        .append('text')
        .attr('x', labelX)
        .attr('y', pos.height / 2 + 10)
        .attr('text-anchor', labelAnchor)
        .attr('fill', '#64748b')
        .attr('font-size', '11px')
        .text(`${node.value.toLocaleString()} 用户`);
    });
  }, [data]);

  const topPaths = data.links
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">用户路径分析</h3>
          <p className="text-sm text-gray-500 mt-1">用户在产品中的主要浏览和使用路径</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-50 rounded-lg">
          <GitBranch className="w-4 h-4 text-purple-600" />
          <span className="text-sm font-medium text-purple-700">桑基图视图</span>
        </div>
      </div>

      <div className="flex items-center gap-6 mb-4 px-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-green-500" />
          <span className="text-xs text-gray-600">入口页面</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-blue-500" />
          <span className="text-xs text-gray-600">功能页面</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-red-500" />
          <span className="text-xs text-gray-600">退出产品</span>
        </div>
      </div>

      <svg ref={svgRef} className="w-full" />

      <div className="mt-6">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">热门路径 Top 5</h4>
        <div className="space-y-2">
          {topPaths.map((path, idx) => {
            const sourceNode = data.nodes.find((n) => n.id === path.source);
            const targetNode = data.nodes.find((n) => n.id === path.target);
            return (
              <div
                key={idx}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-primary-100 text-primary-600 text-xs font-medium flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <span className="text-sm font-medium text-gray-700">{sourceNode?.name}</span>
                  <ArrowRight className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-700">{targetNode?.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary-500 rounded-full"
                      style={{ width: `${(path.value / data.nodes[0].value) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-gray-700 w-16 text-right">
                    {path.value.toLocaleString()}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default PathAnalysis;
