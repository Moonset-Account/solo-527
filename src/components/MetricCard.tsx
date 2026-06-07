import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { ReactNode } from 'react';

interface MetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  icon: ReactNode;
  trend?: number;
  trendLabel?: string;
  sampleSize?: number;
  delay?: number;
}

export function MetricCard({
  title,
  value,
  unit,
  icon,
  trend,
  trendLabel,
  sampleSize,
  delay = 0,
}: MetricCardProps) {
  const trendColor = trend !== undefined
    ? trend > 0
      ? 'text-success'
      : trend < 0
        ? 'text-danger'
        : 'text-slate-400'
    : '';

  const TrendIcon = trend !== undefined
    ? trend > 0
      ? TrendingUp
      : trend < 0
        ? TrendingDown
        : Minus
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay * 0.1, duration: 0.4 }}
      className="glass-card card-hover p-5"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-lg bg-brand-400/15 flex items-center justify-center text-brand-300">
          {icon}
        </div>
        {trend !== undefined && TrendIcon && (
          <div className={`flex items-center gap-1 text-xs ${trendColor}`}>
            <TrendIcon className="w-3.5 h-3.5" />
            <span>{Math.abs(trend).toFixed(1)}%</span>
            {trendLabel && <span className="text-slate-500 ml-1">{trendLabel}</span>}
          </div>
        )}
      </div>
      <div className="metric-value mb-1">
        {value}
        {unit && <span className="text-sm text-slate-400 ml-1 font-normal">{unit}</span>}
      </div>
      <div className="flex items-center justify-between">
        <p className="metric-label">{title}</p>
        {sampleSize !== undefined && (
          <span className="text-xs text-slate-500">
            样本量: {sampleSize}
          </span>
        )}
      </div>
    </motion.div>
  );
}
