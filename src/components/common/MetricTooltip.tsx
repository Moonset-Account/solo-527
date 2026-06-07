import React, { useState } from 'react';
import { Info, X } from 'lucide-react';
import { IndicatorKey } from '@/types';
import { INDICATOR_STANDARDS } from '@/data/indicators';

interface MetricTooltipProps {
  indicator: IndicatorKey;
  children?: React.ReactNode;
}

export const MetricTooltip: React.FC<MetricTooltipProps> = ({ indicator, children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const std = INDICATOR_STANDARDS[indicator];

  return (
    <div className="relative inline-block">
      <div className="flex items-center gap-1 cursor-help" onClick={() => setIsOpen(!isOpen)}>
        {children || (
          <button className="p-1 rounded hover:bg-zinc-100 transition-colors">
            <Info size={14} className="text-zinc-500" />
          </button>
        )}
      </div>
      
      {isOpen && (
        <div className="absolute z-50 w-72 bg-white rounded-lg shadow-xl border border-zinc-200 p-4 mt-2 right-0">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-zinc-900">
              {std.name} {std.unit && `(${std.unit})`}
            </h4>
            <button 
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-zinc-100 rounded"
            >
              <X size={14} className="text-zinc-500" />
            </button>
          </div>
          
          <div className="space-y-3 text-sm">
            <div>
              <p className="font-medium text-zinc-700 mb-1">指标定义</p>
              <p className="text-zinc-600">{std.description}</p>
            </div>
            
            <div>
              <p className="font-medium text-zinc-700 mb-1">标准限值</p>
              <p className="text-zinc-600">
                {std.standard.min !== null && `≥ ${std.standard.min}${std.unit}`}
                {std.standard.min !== null && std.standard.max !== null && ' ~ '}
                {std.standard.max !== null && `≤ ${std.standard.max}${std.unit}`}
                {std.standard.min === null && std.standard.max === null && '无限制'}
              </p>
            </div>
            
            <div>
              <p className="font-medium text-zinc-700 mb-1">检测方法</p>
              <p className="text-zinc-600">{std.detectionMethod}</p>
            </div>
            
            <div className="bg-amber-50 border border-amber-200 rounded p-2">
              <p className="font-medium text-amber-800 mb-1">数据说明</p>
              <p className="text-amber-700 text-xs">{std.limitation}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
