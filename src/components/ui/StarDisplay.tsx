import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StarDisplayProps {
  rating: 0 | 1 | 2 | 3
  size?: 'sm' | 'md' | 'lg'
}

const sizeMap = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
}

export default function StarDisplay({ rating, size = 'md' }: StarDisplayProps) {
  const iconSize = sizeMap[size]

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3].map((i) => (
        <Star
          key={i}
          className={cn(
            iconSize,
            i <= rating
              ? 'fill-[#ffd700] text-[#ffd700] drop-shadow-[0_0_6px_rgba(255,215,0,0.6)]'
              : 'fill-[#333] text-[#333]',
          )}
        />
      ))}
    </div>
  )
}
