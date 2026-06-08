import { ReactNode, MouseEventHandler } from 'react';
import { cn } from './GameButton';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  title?: ReactNode;
  subtitle?: ReactNode;
  icon?: ReactNode;
  onClick?: MouseEventHandler<HTMLDivElement>;
  hoverable?: boolean;
  selected?: boolean;
  glow?: boolean;
}

export function GlassCard({
  children, className, title, subtitle, icon,
  onClick, hoverable, selected, glow,
}: GlassCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'relative rounded-2xl p-5 border transition-all duration-300',
        'bg-slate-800/50 border-slate-600/40 backdrop-blur-xl',
        hoverable && 'cursor-pointer hover:border-cyan-400/60 hover:-translate-y-1 hover:shadow-2xl hover:shadow-cyan-500/10',
        selected && 'border-cyan-400 shadow-xl shadow-cyan-500/20 ring-2 ring-cyan-400/30',
        glow && 'shadow-xl shadow-cyan-500/20',
        onClick && 'group',
        className,
      )}
    >
      {(title || icon) && (
        <div className="flex items-start gap-3 mb-3">
          {icon && (
            <div className={cn(
              'p-2.5 rounded-xl flex-shrink-0',
              selected
                ? 'bg-gradient-to-br from-cyan-400 to-cyan-600 text-white shadow-lg shadow-cyan-500/30'
                : 'bg-slate-700/60 text-cyan-300 group-hover:bg-cyan-500/20',
            )}>
              {icon}
            </div>
          )}
          <div className="flex-1 min-w-0">
            {title && <h3 className="font-semibold text-slate-100 text-lg leading-tight">{title}</h3>}
            {subtitle && <p className="text-sm text-slate-400 mt-1">{subtitle}</p>}
          </div>
        </div>
      )}
      <div>{children}</div>
    </div>
  );
}
