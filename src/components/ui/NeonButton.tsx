import { cn } from '@/lib/utils'

interface NeonButtonProps {
  variant?: 'green' | 'orange'
  size?: 'sm' | 'md' | 'lg'
  children: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  className?: string
}

const variantStyles = {
  green: {
    border: 'border-[#00ff88]',
    text: 'text-[#00ff88]',
    shadow: 'shadow-[0_0_8px_rgba(0,255,136,0.4)]',
    hoverShadow: 'hover:shadow-[0_0_20px_rgba(0,255,136,0.7)]',
  },
  orange: {
    border: 'border-[#ff8800]',
    text: 'text-[#ff8800]',
    shadow: 'shadow-[0_0_8px_rgba(255,136,0,0.4)]',
    hoverShadow: 'hover:shadow-[0_0_20px_rgba(255,136,0,0.7)]',
  },
}

const sizeStyles = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-7 py-3.5 text-base',
}

export default function NeonButton({
  variant = 'green',
  size = 'md',
  children,
  onClick,
  disabled = false,
  className,
}: NeonButtonProps) {
  const vs = variantStyles[variant]

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'rounded-lg border bg-black/60 font-semibold transition-all duration-200',
        'hover:scale-105 active:scale-95',
        vs.border,
        vs.text,
        vs.shadow,
        vs.hoverShadow,
        sizeStyles[size],
        disabled && 'cursor-not-allowed opacity-40 hover:scale-100',
        className,
      )}
    >
      {children}
    </button>
  )
}
