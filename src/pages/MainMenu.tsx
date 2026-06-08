import { useNavigate } from 'react-router-dom'
import { Play, Settings, ArrowRight } from 'lucide-react'
import { SaveManager } from '@/game/engine/SaveManager'

const BUILDINGS = [
  { left: '5%', width: 40, height: 120 },
  { left: '10%', width: 30, height: 180 },
  { left: '16%', width: 50, height: 90 },
  { left: '24%', width: 35, height: 200 },
  { left: '30%', width: 45, height: 140 },
  { left: '38%', width: 30, height: 160 },
  { left: '44%', width: 55, height: 110 },
  { left: '52%', width: 40, height: 190 },
  { left: '58%', width: 35, height: 130 },
  { left: '64%', width: 50, height: 170 },
  { left: '72%', width: 30, height: 100 },
  { left: '78%', width: 45, height: 210 },
  { left: '85%', width: 35, height: 150 },
  { left: '91%', width: 40, height: 180 },
]

const RAIN_DROPS = Array.from({ length: 25 }, (_, i) => ({
  id: i,
  left: `${Math.random() * 100}%`,
  height: `${15 + Math.random() * 25}px`,
  delay: `${Math.random() * 2}s`,
  duration: `${0.6 + Math.random() * 0.8}s`,
}))

export default function MainMenu() {
  const navigate = useNavigate()
  const hasSave = SaveManager.hasSave()

  const handleStart = () => {
    if (hasSave) {
      navigate('/levels')
    } else {
      navigate('/tutorial')
    }
  }

  return (
    <div className="relative w-full h-full overflow-hidden flex items-center justify-center"
      style={{ background: 'linear-gradient(180deg, #0a0f1a 0%, #0f1923 40%, #1a2332 100%)' }}>

      <div className="absolute bottom-0 left-0 right-0 flex items-end justify-center gap-[2px]">
        {BUILDINGS.map((b, i) => (
          <div
            key={i}
            className="relative"
            style={{
              left: b.left,
              width: b.width,
              height: b.height,
              background: `linear-gradient(180deg, #1a2332 0%, #0d1520 100%)`,
              borderTop: '1px solid rgba(0, 201, 167, 0.1)',
              position: 'absolute',
              bottom: 0,
            }}
          >
            {Array.from({ length: Math.floor(b.height / 20) }, (_, row) => (
              <div key={row} className="flex gap-[3px] pt-[6px] px-[3px]">
                {Array.from({ length: Math.floor(b.width / 10) }, (_, col) => (
                  <div
                    key={col}
                    style={{
                      width: 4,
                      height: 4,
                      backgroundColor: Math.random() > 0.4
                        ? `rgba(255, 200, 100, ${0.2 + Math.random() * 0.4})`
                        : 'rgba(0,0,0,0.3)',
                    }}
                  />
                ))}
              </div>
            ))}
          </div>
        ))}
      </div>

      {RAIN_DROPS.map((drop) => (
        <div
          key={drop.id}
          className="rain-drop"
          style={{
            left: drop.left,
            height: drop.height,
            animationDelay: drop.delay,
            animationDuration: drop.duration,
          }}
        />
      ))}

      <div className="scan-line" />

      <div className="relative z-10 flex flex-col items-center gap-8">
        <div className="flex flex-col items-center">
          <h1 className="font-display text-6xl font-black tracking-wider glow-text" style={{ color: '#ff6b35' }}>
            迷你城市
          </h1>
          <h2 className="font-display text-5xl font-bold tracking-wider glow-text mt-2" style={{ color: '#ff6b35' }}>
            应急调度
          </h2>
          <p className="mt-4 text-sm tracking-widest" style={{ color: '#8899aa' }}>
            MINI CITY EMERGENCY DISPATCH
          </p>
        </div>

        <div className="flex flex-col gap-3 mt-8 w-64">
          <button
            onClick={handleStart}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-bold text-base transition-all duration-200 hover:scale-105 active:scale-95"
            style={{
              background: 'linear-gradient(135deg, #ff6b35, #e85d2a)',
              color: '#fff',
              boxShadow: '0 4px 15px rgba(255, 107, 53, 0.3)',
            }}
          >
            <Play size={18} />
            开始游戏
          </button>

          {hasSave && (
            <button
              onClick={() => navigate('/levels')}
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-bold text-base transition-all duration-200 hover:scale-105 active:scale-95"
              style={{
                background: 'rgba(0, 201, 167, 0.15)',
                color: '#00c9a7',
                border: '1px solid rgba(0, 201, 167, 0.3)',
              }}
            >
              <ArrowRight size={18} />
              继续游戏
            </button>
          )}

          <button
            onClick={() => navigate('/settings')}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-bold text-base transition-all duration-200 hover:scale-105 active:scale-95"
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              color: '#8899aa',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <Settings size={18} />
            设置
          </button>
        </div>
      </div>
    </div>
  )
}
