import { ReactNode } from 'react';
import { Download, Maximize2, MoreHorizontal, RefreshCw } from 'lucide-react';

interface ChartCardProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  onExport?: () => void;
  onRefresh?: () => void;
  onDrillDown?: () => void;
  className?: string;
  actions?: ReactNode;
}

export default function ChartCard({
  title,
  subtitle,
  children,
  onExport,
  onRefresh,
  className,
  actions,
}: ChartCardProps) {
  return (
    <div className={`overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm ${className || ''}`}>
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
        <div>
          <h3 className="text-base font-semibold text-slate-800">{title}</h3>
          {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-1">
          {actions}
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
            >
              <RefreshCw size={16} />
            </button>
          )}
          {onExport && (
            <button
              onClick={onExport}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
            >
              <Download size={16} />
            </button>
          )}
          <button className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600">
            <MoreHorizontal size={16} />
          </button>
        </div>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}
