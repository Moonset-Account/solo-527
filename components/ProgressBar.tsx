'use client';

import { cn } from '@/lib/utils';

interface ProgressBarProps {
  progress: number;
  className?: string;
  showLabel?: boolean;
  size?: 'sm' | 'md';
}

export default function ProgressBar({ progress, className, showLabel = true, size = 'md' }: ProgressBarProps) {
  const getProgressColor = (p: number) => {
    if (p >= 100) return 'bg-success-500';
    if (p >= 70) return 'bg-primary-500';
    if (p >= 40) return 'bg-warning-500';
    return 'bg-danger-500';
  };

  const heightClass = size === 'sm' ? 'h-1.5' : 'h-2';

  return (
    <div className={cn('w-full', className)}>
      {showLabel && (
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs text-gray-500">进度</span>
          <span className="text-xs font-medium text-gray-700">{progress}%</span>
        </div>
      )}
      <div className={cn('progress-bar', heightClass)}>
        <div
          className={cn('progress-bar-fill', getProgressColor(progress))}
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>
    </div>
  );
}
