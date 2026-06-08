import { Lock, FlaskConical } from 'lucide-react'
import { cn } from '@/lib/utils'
import StarDisplay from '@/components/ui/StarDisplay'

interface LevelCardProps {
  levelId: string
  name: string
  description: string
  starRating: 0 | 1 | 2 | 3
  isUnlocked: boolean
  isSandbox: boolean
  onClick: (levelId: string) => void
}

export default function LevelCard({
  levelId,
  name,
  description,
  starRating,
  isUnlocked,
  isSandbox,
  onClick,
}: LevelCardProps) {
  const borderColor = isSandbox
    ? 'border-[#ff8800]'
    : isUnlocked
      ? 'border-[#00ff88]/40'
      : 'border-white/10'

  const hoverBorderColor = isSandbox
    ? 'hover:border-[#ff8800] hover:shadow-[0_0_20px_rgba(255,136,0,0.5)]'
    : 'hover:border-[#00ff88] hover:shadow-[0_0_20px_rgba(0,255,136,0.5)]'

  return (
    <button
      onClick={() => isUnlocked && onClick(levelId)}
      disabled={!isUnlocked}
      className={cn(
        'relative flex flex-col items-center gap-3 rounded-xl border-2 bg-[#0d1526] p-5 transition-all duration-300',
        borderColor,
        !isUnlocked && 'cursor-not-allowed opacity-40',
        isUnlocked && 'cursor-pointer hover:scale-[1.03]',
        isUnlocked && hoverBorderColor,
      )}
    >
      {isSandbox && isUnlocked && (
        <FlaskConical className="h-8 w-8 text-[#ff8800] drop-shadow-[0_0_8px_rgba(255,136,0,0.6)]" />
      )}

      {!isUnlocked && (
        <Lock className="h-8 w-8 text-white/30" />
      )}

      {isUnlocked && (
        <>
          <h3
            className={cn(
              'text-lg font-bold',
              isSandbox ? 'text-[#ff8800]' : 'text-[#00ff88]',
            )}
          >
            {name}
          </h3>
          <p className="text-center text-sm text-white/60">{description}</p>
          <StarDisplay rating={starRating} size="sm" />
        </>
      )}

      {!isUnlocked && (
        <span className="text-sm text-white/30">{name}</span>
      )}
    </button>
  )
}
