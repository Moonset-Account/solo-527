import { useMemo } from 'react'
import { motion } from 'framer-motion'
import useGameStore from '@/systems/GameStateManager'
import chapterManager from '@/systems/ChapterManager'

interface RoomViewProps {
  chapterId: string
  roomId: string
  onHotspotClick: (hotspotId: string, type: string, targetId: string) => void
}

const dustParticles = Array.from({ length: 15 }, (_, i) => ({
  id: i,
  left: Math.random() * 100,
  delay: Math.random() * 8,
  duration: 6 + Math.random() * 6,
  size: 1 + Math.random() * 2,
  opacity: 0.15 + Math.random() * 0.25,
}))

export default function RoomView({ chapterId, roomId, onHotspotClick }: RoomViewProps) {
  const inventory = useGameStore((s) => s.inventory)

  const roomConfig = useMemo(
    () => chapterManager.getRoom(chapterId, roomId),
    [chapterId, roomId],
  )

  if (!roomConfig) return null

  return (
    <div className="relative w-full h-full overflow-hidden select-none">
      <div
        className="absolute inset-0"
        style={{ background: roomConfig.backgroundStyle }}
      />

      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          animation: 'flicker 4s ease-in-out infinite',
        }}
      />

      <div className="absolute top-0 left-0 right-0 z-20 p-4">
        <h2 className="text-lg font-serif text-amber-200/80 tracking-wider text-center drop-shadow-lg">
          {roomConfig.name}
        </h2>
      </div>

      <div className="absolute inset-0 pointer-events-none z-10">
        {dustParticles.map((p) => (
          <div
            key={p.id}
            className="absolute rounded-full bg-amber-100"
            style={{
              left: `${p.left}%`,
              bottom: '-2%',
              width: p.size,
              height: p.size,
              opacity: p.opacity,
              animation: `dustFloat ${p.duration}s ${p.delay}s ease-in infinite`,
            }}
          />
        ))}
      </div>

      {roomConfig.hotspots.map((hotspot) => {
        if (hotspot.type === 'item' && inventory.includes(hotspot.targetId)) {
          return null
        }

        return (
          <motion.div
            key={hotspot.id}
            id={hotspot.id}
            className="absolute cursor-pointer z-10 group"
            style={{
              left: `${hotspot.x}%`,
              top: `${hotspot.y}%`,
              width: `${hotspot.width}%`,
              height: `${hotspot.height}%`,
            }}
            whileHover={{
              boxShadow: '0 0 15px 3px rgba(200, 168, 110, 0.4)',
            }}
            onClick={() =>
              onHotspotClick(hotspot.id, hotspot.type, hotspot.targetId)
            }
          >
            <div className="w-full h-full border border-[#c8a86e]/15 hover:border-[#c8a86e]/40 rounded transition-colors duration-300 relative">
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-0.5 rounded text-[10px] font-serif text-amber-200/0 group-hover:text-amber-200/80 bg-black/0 group-hover:bg-black/70 whitespace-nowrap transition-all duration-200 pointer-events-none">
                {hotspot.label}
              </div>
            </div>
          </motion.div>
        )
      })}

      <style>{`
        @keyframes dustFloat {
          0% {
            transform: translateY(0) translateX(0);
            opacity: 0;
          }
          10% {
            opacity: 0.25;
          }
          90% {
            opacity: 0.15;
          }
          100% {
            transform: translateY(-100vh) translateX(${Math.random() > 0.5 ? '' : '-'}30px);
            opacity: 0;
          }
        }

        @keyframes flicker {
          0%, 100% { opacity: 0.02; }
          10% { opacity: 0.05; }
          20% { opacity: 0.02; }
          30% { opacity: 0.06; }
          40% { opacity: 0.01; }
          50% { opacity: 0.04; }
          60% { opacity: 0.02; }
          70% { opacity: 0.07; }
          80% { opacity: 0.03; }
          90% { opacity: 0.05; }
        }
      `}</style>
    </div>
  )
}
