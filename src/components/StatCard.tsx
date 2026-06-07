import React, { useEffect, useState } from 'react';
import { cn, formatCurrency } from '@/utils';

interface StatCardProps {
  title: string;
  value: number | string;
  suffix?: string;
  prefix?: string;
  trend?: number;
  trendLabel?: string;
  icon?: React.ReactNode;
  color?: 'blue' | 'green' | 'orange' | 'red' | 'purple';
  onClick?: () => void;
  className?: string;
  isCurrency?: boolean;
}

const colorClasses = {
  blue: 'from-blue-500 to-blue-600',
  green: 'from-green-500 to-green-600',
  orange: 'from-orange-500 to-orange-600',
  red: 'from-red-500 to-red-600',
  purple: 'from-purple-500 to-purple-600',
};

const iconBgClasses = {
  blue: 'bg-blue-100 text-blue-600',
  green: 'bg-green-100 text-green-600',
  orange: 'bg-orange-100 text-orange-600',
  red: 'bg-red-100 text-red-600',
  purple: 'bg-purple-100 text-purple-600',
};

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  suffix,
  prefix,
  trend,
  trendLabel,
  icon,
  color = 'blue',
  onClick,
  className,
  isCurrency,
}) => {
  const [displayValue, setDisplayValue] = useState(0);
  const numericValue = typeof value === 'number' ? value : 0;

  useEffect(() => {
    if (typeof value === 'number') {
      const duration = 1000;
      const steps = 30;
      const increment = value / steps;
      let current = 0;
      const timer = setInterval(() => {
        current += increment;
        if (current >= value) {
          setDisplayValue(value);
          clearInterval(timer);
        } else {
          setDisplayValue(Math.floor(current));
        }
      }, duration / steps);
      return () => clearInterval(timer);
    }
  }, [value]);

  const displayText = typeof value === 'string' 
    ? value 
    : isCurrency 
      ? formatCurrency(displayValue)
      : displayValue.toLocaleString();

  return (
    <div
      onClick={onClick}
      className={cn(
        'relative overflow-hidden rounded-lg bg-white p-6 shadow-sm border border-gray-100',
        'transition-all duration-300 hover:shadow-md hover:-translate-y-0.5',
        onClick && 'cursor-pointer',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 font-mono">
            {prefix}
            {displayText}
            {suffix && <span className="text-lg font-normal text-gray-500 ml-1">{suffix}</span>}
          </p>
          {trend !== undefined && (
            <p className="mt-2 flex items-center text-sm">
              <span
                className={cn(
                  'inline-flex items-center font-medium',
                  trend >= 0 ? 'text-green-600' : 'text-red-600'
                )}
              >
                {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
              </span>
              {trendLabel && (
                <span className="text-gray-500 ml-2">{trendLabel}</span>
              )}
            </p>
          )}
        </div>
        {icon && (
          <div className={cn(
            'flex h-12 w-12 items-center justify-center rounded-lg',
            iconBgClasses[color]
          )}>
            {icon}
          </div>
        )}
      </div>
      <div className={cn(
        'absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r',
        colorClasses[color]
      )} />
    </div>
  );
};
