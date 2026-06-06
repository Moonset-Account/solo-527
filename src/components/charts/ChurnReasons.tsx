import React from 'react';
import { ChurnReason } from '../../types';
import { PieChart, AlertTriangle } from 'lucide-react';

interface ChurnReasonsProps {
  data: ChurnReason[];
}

const ChurnReasons: React.FC<ChurnReasonsProps> = ({ data }) => {
  const total = data.reduce((sum, r) => sum + r.count, 0);
  const maxCount = Math.max(...data.map((d) => d.count));

  const colors = [
    '#ef4444',
    '#f97316',
    '#eab308',
    '#22c55e',
    '#06b6d4',
    '#3b82f6',
    '#8b5cf6',
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">流失原因分析</h3>
          <p className="text-sm text-gray-500 mt-1">用户取消订阅或停止使用的主要原因</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 rounded-lg">
          <AlertTriangle className="w-4 h-4 text-red-500" />
          <span className="text-sm font-medium text-red-700">共 {total} 例流失</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-3">
          {data.map((reason, idx) => (
            <div key={reason.id} className="group">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: colors[idx % colors.length] }}
                  />
                  <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                    {reason.reason}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-gray-800">
                    {reason.count}
                  </span>
                  <span className="text-xs text-gray-500 w-12 text-right">
                    {reason.percentage}%
                  </span>
                </div>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${(reason.count / maxCount) * 100}%`,
                    backgroundColor: colors[idx % colors.length],
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-center">
          <div className="relative">
            <svg width="220" height="220" className="-rotate-90">
              {(() => {
                let cumulativePercent = 0;
                return data.map((reason, idx) => {
                  const startPercent = cumulativePercent;
                  cumulativePercent += reason.percentage;
                  const endPercent = cumulativePercent;
                  
                  const startAngle = (startPercent / 100) * 2 * Math.PI;
                  const endAngle = (endPercent / 100) * 2 * Math.PI;
                  
                  const x1 = 100 + 80 * Math.cos(startAngle);
                  const y1 = 100 + 80 * Math.sin(startAngle);
                  const x2 = 100 + 80 * Math.cos(endAngle);
                  const y2 = 100 + 80 * Math.sin(endAngle);
                  
                  const largeArcFlag = endPercent - startPercent > 50 ? 1 : 0;
                  
                  const pathData = [
                    `M 100 100`,
                    `L ${x1} ${y1}`,
                    `A 80 80 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                    `Z`,
                  ].join(' ');

                  return (
                    <path
                      key={reason.id}
                      d={pathData}
                      fill={colors[idx % colors.length]}
                      opacity={0.85}
                      className="hover:opacity-100 transition-opacity cursor-pointer"
                    />
                  );
                });
              })()}
              <circle cx="100" cy="100" r="50" fill="white" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <PieChart className="w-8 h-8 text-gray-400 mx-auto mb-1" />
                <div className="text-2xl font-bold text-gray-800">{total}</div>
                <div className="text-xs text-gray-500">总流失数</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 p-4 bg-red-50 rounded-lg border border-red-100">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <div className="text-sm font-medium text-red-800">关键洞察</div>
            <div className="text-xs text-red-600 mt-1">
              "{data[0]?.reason}" 是最主要的流失原因，占比 {data[0]?.percentage}%。
              建议产品团队优先评估相关功能的改进方案，客户成功团队加强主动干预。
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChurnReasons;
