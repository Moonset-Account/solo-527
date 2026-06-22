'use client';

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { cn } from '@/utils';

interface ChartProps {
  data: any[];
  className?: string;
  height?: number;
}

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export function TrendLineChart({
  data,
  xKey = 'name',
  yKeys = [{ key: 'value', name: '数值' }],
  className,
  height = 300,
}: ChartProps & {
  xKey?: string;
  yKeys?: { key: string; name: string; color?: string }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={height} className={className}>
      <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey={xKey} tick={{ fontSize: 12 }} stroke="#94a3b8" />
        <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
        <Tooltip
          contentStyle={{
            backgroundColor: 'white',
            border: '1px solid #e2e8f0',
            borderRadius: '6px',
            fontSize: '12px',
          }}
        />
        <Legend wrapperStyle={{ fontSize: '12px' }} />
        {yKeys.map((y) => (
          <Line
            key={y.key}
            type="monotone"
            dataKey={y.key}
            name={y.name}
            stroke={y.color || '#2563eb'}
            strokeWidth={2}
            dot={{ fill: y.color || '#2563eb', r: 4 }}
            activeDot={{ r: 6 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

export function StatusBarChart({
  data,
  xKey = 'name',
  yKey = 'value',
  className,
  height = 300,
  color = '#2563eb',
}: ChartProps & {
  xKey?: string;
  yKey?: string;
  name?: string;
  color?: string;
}) {
  return (
    <ResponsiveContainer width="100%" height={height} className={className}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey={xKey} tick={{ fontSize: 12 }} stroke="#94a3b8" />
        <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
        <Tooltip
          contentStyle={{
            backgroundColor: 'white',
            border: '1px solid #e2e8f0',
            borderRadius: '6px',
            fontSize: '12px',
          }}
        />
        <Bar dataKey={yKey} fill={color} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function FacilityPieChart({
  data,
  className,
  height = 250,
}: ChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height} className={className}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={90}
          paddingAngle={2}
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: 'white',
            border: '1px solid #e2e8f0',
            borderRadius: '6px',
            fontSize: '12px',
          }}
        />
        <Legend wrapperStyle={{ fontSize: '12px' }} />
      </PieChart>
    </ResponsiveContainer>
  );
}

interface ProgressRingProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
}

export function ProgressRing({
  progress,
  size = 120,
  strokeWidth = 8,
  className,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  const getColor = (p: number) => {
    if (p >= 80) return '#10b981';
    if (p >= 60) return '#2563eb';
    if (p >= 40) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          stroke="#e2e8f0"
          fill="transparent"
          strokeWidth={strokeWidth}
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <circle
          stroke={getColor(progress)}
          fill="transparent"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          r={radius}
          cx={size / 2}
          cy={size / 2}
          className="transition-all duration-500"
        />
      </svg>
      <span className="absolute text-2xl font-bold text-slate-900">{progress}%</span>
    </div>
  );
}

interface StepperProps {
  steps: { label: string; status: 'completed' | 'current' | 'pending' }[];
  className?: string;
}

export function Stepper({ steps, className }: StepperProps) {
  return (
    <div className={cn('flex items-center justify-between w-full', className)}>
      {steps.map((step, index) => (
        <div key={index} className="flex items-center flex-1 last:flex-none">
          <div className="flex flex-col items-center">
            <div
              className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all',
                step.status === 'completed' && 'bg-success-500 text-white',
                step.status === 'current' && 'bg-primary-600 text-white',
                step.status === 'pending' && 'bg-slate-200 text-slate-500'
              )}
            >
              {step.status === 'completed' ? '✓' : index + 1}
            </div>
            <span
              className={cn(
                'mt-2 text-xs font-medium',
                step.status === 'current' ? 'text-primary-700' : 'text-slate-500'
              )}
            >
              {step.label}
            </span>
          </div>
          {index < steps.length - 1 && (
            <div
              className={cn(
                'flex-1 h-0.5 mx-2 rounded',
                step.status === 'completed' ? 'bg-success-500' : 'bg-slate-200'
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
}
