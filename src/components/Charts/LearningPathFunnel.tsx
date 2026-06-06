import React, { useState } from 'react';
import { Funnel, FunnelChart, Tooltip, LabelList, ResponsiveContainer } from 'recharts';
import { AlertTriangle, Users, ArrowRight } from 'lucide-react';
import { FunnelNode, ActivityType } from '../../data/types';
import { COLORS } from '../../data/constants';

interface LearningPathFunnelProps {
  data: FunnelNode[];
  totalStudents: number;
  onNodeClick: (activityType: ActivityType) => void;
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const item = payload[0].payload;
    return (
      <div className="bg-white rounded-lg shadow-lg border border-gray-100 p-3">
        <p className="font-semibold text-gray-800 mb-1">{item.name}</p>
        <p className="text-sm text-gray-600">完成人数: {item.value} 人</p>
        <p className="text-sm text-gray-600">
          转化率: {(item.conversionRate * 100).toFixed(1)}%
        </p>
        {item.isDropoutPoint && (
          <p className="text-sm text-red-500 flex items-center gap-1 mt-1">
            <AlertTriangle size={12} />
            掉队节点
          </p>
        )}
      </div>
    );
  }
  return null;
};

export const LearningPathFunnel: React.FC<LearningPathFunnelProps> = ({
  data,
  totalStudents,
  onNodeClick,
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  
  const chartData = data.map((item, index) => ({
    ...item,
    fill: item.isDropoutPoint ? COLORS.danger : COLORS.primary,
    opacity: hoveredIndex === null || hoveredIndex === index ? 1 : 0.6,
  }));
  
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-gray-800">学习路径转化漏斗</h3>
          <p className="text-sm text-gray-500 mt-0.5 flex items-center gap-1">
            <Users size={14} />
            总样本量: {totalStudents} 人
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-blue-600"></span>
            正常
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></span>
            掉队节点
          </span>
        </div>
      </div>
      
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <FunnelChart data={chartData}>
            <Tooltip content={<CustomTooltip />} />
            <Funnel
              dataKey="value"
              isAnimationActive
              animationDuration={500}
              onMouseEnter={(data: any) => {
                if (data && data.payload) {
                  const index = chartData.findIndex((d) => d.activityType === data.payload.activityType);
                  setHoveredIndex(index);
                }
              }}
              onMouseLeave={() => setHoveredIndex(null)}
              onClick={(entry: any) => onNodeClick(entry.activityType as ActivityType)}
            >
              <LabelList
                position="right"
                fill="#1D2129"
                stroke="none"
                dataKey="name"
                fontSize={13}
              />
              <LabelList
                position="center"
                fill="#fff"
                stroke="none"
                formatter={(value: number, entry: any) => [
                  `${value}人`,
                  `${(entry.payload.conversionRate * 100).toFixed(0)}%`,
                ]}
                fontSize={12}
              />
            </Funnel>
          </FunnelChart>
        </ResponsiveContainer>
      </div>
      
      <div className="mt-4 flex items-center justify-center text-sm text-gray-500">
        <span>点击节点可下钻查看掉队学员</span>
        <ArrowRight size={14} className="ml-1" />
      </div>
    </div>
  );
};
