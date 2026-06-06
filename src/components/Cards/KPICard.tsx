import React from 'react';
import { TrendingUp, TrendingDown, Users, AlertTriangle } from 'lucide-react';
import { KPICardData } from '../../data/types';

interface KPICardProps {
  data: KPICardData;
  delay?: number;
}

export const KPICard: React.FC<KPICardProps> = ({ data, delay = 0 }) => {
  const isPositive = data.trend >= 0;
  
  return (
    <div
      className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-all duration-300"
      style={{
        animation: `fadeInUp 0.5s ease-out ${delay}ms both`,
      }}
    >
      <div className="flex items-start justify-between mb-3">
        <span className="text-sm font-medium text-gray-500">{data.title}</span>
        {data.isLowSample && (
          <div className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
            <AlertTriangle size={12} />
            <span>样本量小</span>
          </div>
        )}
      </div>
      
      <div className="flex items-end gap-3">
        <div className="text-3xl font-bold text-gray-800">
          {data.value.toFixed(1)}
          <span className="text-lg font-normal text-gray-500 ml-1">{data.unit}</span>
        </div>
        
        <div className={`flex items-center gap-1 text-sm font-medium ${
          isPositive ? 'text-green-600' : 'text-red-500'
        }`}>
          {isPositive ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
          <span>{Math.abs(data.trend).toFixed(1)}%</span>
        </div>
      </div>
      
      <div className="mt-3 flex items-center gap-1.5 text-xs text-gray-400">
        <Users size={12} />
        <span>样本量: {data.sampleSize}</span>
      </div>
    </div>
  );
};
