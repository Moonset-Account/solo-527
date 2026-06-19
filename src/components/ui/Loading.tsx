import * as React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/utils';

interface LoadingProps {
  fullscreen?: boolean;
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
}

const sizeClasses: Record<string, string> = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
};

const textSizeClasses: Record<string, string> = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
};

export default function Loading({
  fullscreen = false,
  size = 'md',
  text = '加载中...',
  className,
}: LoadingProps) {
  if (fullscreen) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm">
        <Loader2 className={cn('animate-spin text-primary-500', sizeClasses[size])} />
        {text && (
          <p className={cn('mt-2 text-neutral-500', textSizeClasses[size])}>{text}</p>
        )}
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col items-center justify-center py-8', className)}>
      <Loader2 className={cn('animate-spin text-primary-500', sizeClasses[size])} />
      {text && (
        <p className={cn('mt-2 text-neutral-500', textSizeClasses[size])}>{text}</p>
      )}
    </div>
  );
}
