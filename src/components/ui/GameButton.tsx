import { forwardRef, ButtonHTMLAttributes, ReactNode } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'success' | 'warning';
type Size = 'sm' | 'md' | 'lg' | 'xl';

interface GameButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
  iconRight?: ReactNode;
  glow?: boolean;
}

export const cn = (...inputs: (string | undefined | null | false)[]): string =>
  twMerge(clsx(inputs));

const variantStyles: Record<Variant, string> = {
  primary:
    'bg-gradient-to-br from-cyan-500/90 to-cyan-600/90 text-white border border-cyan-300/40 hover:from-cyan-400 hover:to-cyan-500 shadow-lg shadow-cyan-500/30',
  secondary:
    'bg-slate-700/70 text-slate-100 border border-slate-500/50 hover:bg-slate-600/80 shadow-md shadow-slate-900/40',
  danger:
    'bg-gradient-to-br from-red-500/90 to-red-700/90 text-white border border-red-300/40 hover:from-red-400 hover:to-red-600 shadow-lg shadow-red-500/30',
  ghost:
    'bg-transparent text-cyan-200 border border-cyan-400/20 hover:bg-cyan-400/10 hover:border-cyan-400/40',
  success:
    'bg-gradient-to-br from-emerald-500/90 to-green-600/90 text-white border border-emerald-300/40 hover:from-emerald-400 hover:to-green-500 shadow-lg shadow-emerald-500/30',
  warning:
    'bg-gradient-to-br from-amber-500/90 to-orange-600/90 text-white border border-amber-300/40 hover:from-amber-400 hover:to-orange-500 shadow-lg shadow-amber-500/30',
};

const sizeStyles: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-sm rounded-md gap-1.5',
  md: 'px-5 py-2.5 text-sm rounded-lg gap-2',
  lg: 'px-7 py-3.5 text-base rounded-xl gap-2.5',
  xl: 'px-10 py-5 text-lg rounded-2xl gap-3 font-semibold',
};

export const GameButton = forwardRef<HTMLButtonElement, GameButtonProps>(
  ({ variant = 'primary', size = 'md', icon, iconRight, glow = false, className, children, disabled, ...rest }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled}
        className={cn(
          'relative inline-flex items-center justify-center font-medium transition-all duration-200',
          'focus:outline-none focus:ring-2 focus:ring-cyan-400/60 focus:ring-offset-2 focus:ring-offset-slate-900',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100',
          'active:scale-95',
          'backdrop-blur-sm',
          variantStyles[variant],
          sizeStyles[size],
          glow && 'animate-pulse-glow',
          className,
        )}
        {...rest}
      >
        {icon && <span className="flex-shrink-0">{icon}</span>}
        {children}
        {iconRight && <span className="flex-shrink-0 ml-auto">{iconRight}</span>}
      </button>
    );
  },
);

GameButton.displayName = 'GameButton';
