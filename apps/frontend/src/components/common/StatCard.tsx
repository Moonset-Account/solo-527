import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: string;
  trend?: number;
  color?: 'blue' | 'green' | 'yellow' | 'red';
  onClick?: () => void;
}

const colorMap = {
  blue: 'bg-blue-50 text-blue-600',
  green: 'bg-green-50 text-green-600',
  yellow: 'bg-yellow-50 text-yellow-600',
  red: 'bg-red-50 text-red-600',
};

export function StatCard({ title, value, icon, trend, color = 'blue', onClick }: StatCardProps) {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-lg shadow-sm p-5 ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-800">{value}</p>
          {trend !== undefined && (
            <p className={`text-sm mt-1 ${trend >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
            </p>
          )}
        </div>
        {icon && (
          <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-2xl ${colorMap[color]}`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
