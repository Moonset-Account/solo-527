import { ReactNode } from 'react';
import { CheckCircle, XCircle } from 'lucide-react';

interface TimelineNodeProps {
  icon: ReactNode;
  title: string;
  description: string;
  operatorName: string;
  timestamp: string;
  result?: 'success' | 'failed' | null;
  isLast?: boolean;
}

export default function TimelineNode({
  icon,
  title,
  description,
  operatorName,
  timestamp,
  result,
  isLast = false,
}: TimelineNodeProps) {
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center text-[var(--color-primary)] shrink-0">
          {icon}
        </div>
        {!isLast && <div className="w-px flex-1 bg-[var(--color-border)] my-1" />}
      </div>
      <div className={`pb-6 flex-1 ${isLast ? 'pb-0' : ''}`}>
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-sm font-semibold text-[var(--color-text)]">{title}</span>
          {result === 'success' && (
            <CheckCircle className="w-4 h-4 text-[var(--color-success)]" />
          )}
          {result === 'failed' && (
            <XCircle className="w-4 h-4 text-[var(--color-danger)]" />
          )}
        </div>
        <p className="text-sm text-[var(--color-text-secondary)] mb-1">{description}</p>
        <div className="flex items-center gap-3 text-xs text-[var(--color-text-secondary)]">
          <span>{operatorName}</span>
          <span>{new Date(timestamp).toLocaleString('zh-CN')}</span>
        </div>
      </div>
    </div>
  );
}
