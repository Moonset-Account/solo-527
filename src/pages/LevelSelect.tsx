import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Lock, Star } from 'lucide-react'
import { ALL_LEVELS } from '@/levels'
import { SaveManager } from '@/game/engine/SaveManager'
import type { LevelSave } from '@/types/game'

export default function LevelSelect() {
  const navigate = useNavigate()

  const levelSaves = useMemo(() => {
    const save = SaveManager.load()
    const map = new Map<string, LevelSave>()
    if (save) {
      for (const ls of save.levels) {
        map.set(ls.levelId, ls)
      }
    }
    return map
  }, [])

  return (
    <div className="w-full h-full flex flex-col" style={{ background: '#0f1923' }}>
      <div className="flex items-center gap-3 px-6 py-4" style={{ borderBottom: '1px solid #2d4052' }}>
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-1 text-sm transition-colors hover:text-white"
          style={{ color: '#8899aa' }}
        >
          <ChevronLeft size={18} />
        </button>
        <h1 className="font-display text-xl font-bold" style={{ color: '#e8edf2' }}>
          关卡选择
        </h1>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin p-6">
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 max-w-3xl mx-auto">
          {ALL_LEVELS.map((level) => {
            const save = levelSaves.get(level.id)
            const unlocked = save?.unlocked ?? level.id === 'level-1'
            const bestStars = save?.bestStars ?? 0

            return (
              <div
                key={level.id}
                onClick={() => unlocked && navigate(`/game/${level.id}`)}
                className={`relative rounded-lg p-4 transition-all duration-200 ${
                  unlocked ? 'cursor-pointer hover:scale-[1.02] active:scale-[0.98]' : 'opacity-50 cursor-not-allowed'
                }`}
                style={{
                  background: '#1a2332',
                  border: `1px solid ${unlocked ? '#2d4052' : 'rgba(255,255,255,0.05)'}`,
                }}
              >
                {!unlocked && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-lg"
                    style={{ background: 'rgba(15, 25, 35, 0.6)' }}>
                    <Lock size={28} style={{ color: '#4a5568' }} />
                  </div>
                )}

                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-base" style={{ color: unlocked ? '#e8edf2' : '#4a5568' }}>
                    {level.name}
                  </h3>
                  <div className="flex gap-0.5">
                    {Array.from({ length: level.difficulty }, (_, i) => (
                      <Star key={i} size={12} fill="#ff6b35" style={{ color: '#ff6b35' }} />
                    ))}
                  </div>
                </div>

                <p className="text-xs leading-relaxed mb-3 line-clamp-2" style={{ color: '#8899aa' }}>
                  {level.description}
                </p>

                <div className="flex items-center gap-1">
                  {Array.from({ length: 3 }, (_, i) => (
                    <Star
                      key={i}
                      size={16}
                      fill={i < bestStars ? '#ffc107' : 'none'}
                      style={{ color: i < bestStars ? '#ffc107' : '#2d4052' }}
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
