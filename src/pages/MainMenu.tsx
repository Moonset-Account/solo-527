import { useState, useCallback, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Play, Save, BookOpen, Settings } from 'lucide-react'
import useGameStore from '@/systems/GameStateManager'
import chapterManager from '@/systems/ChapterManager'
import saveManager from '@/systems/SaveManager'
import soundManager from '@/systems/SoundManager'
import ChapterSelect from '@/components/ui/ChapterSelect'
import SettingsModal from '@/components/ui/SettingsModal'

const dustParticles = Array.from({ length: 20 }, (_, i) => ({
  id: i,
  left: Math.random() * 100,
  delay: Math.random() * 10,
  duration: 7 + Math.random() * 7,
  size: 1 + Math.random() * 2,
  opacity: 0.1 + Math.random() * 0.2,
}))

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.2, delayChildren: 0.5 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: 'easeOut' },
  },
}

export default function MainMenu() {
  const navigate = useNavigate()
  const setChapter = useGameStore((s) => s.setChapter)
  const enterRoom = useGameStore((s) => s.enterRoom)
  const setPhase = useGameStore((s) => s.setPhase)

  const [showChapterSelect, setShowChapterSelect] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [ambientStarted, setAmbientStarted] = useState(false)

  const hasSave = useMemo(() => saveManager.hasSave(), [])

  const startAmbient = useCallback(() => {
    if (!ambientStarted) {
      soundManager.playAmbient('atmos_low_hum')
      setAmbientStarted(true)
    }
  }, [ambientStarted])

  const handleStartGame = useCallback(() => {
    startAmbient()
    soundManager.play('sfx_click')
    navigate('/tutorial')
  }, [navigate, startAmbient])

  const handleContinueGame = useCallback(() => {
    startAmbient()
    soundManager.play('sfx_click')
    const saveData = saveManager.load()
    if (saveData) {
      if (saveData.currentChapter) setChapter(saveData.currentChapter)
      if (saveData.currentRoom) enterRoom(saveData.currentRoom)
      setPhase('playing')
      navigate('/game')
    }
  }, [navigate, setChapter, enterRoom, setPhase, startAmbient])

  const handleChapterSelect = useCallback(() => {
    startAmbient()
    soundManager.play('sfx_click')
    setShowChapterSelect(true)
  }, [startAmbient])

  const handleSelectChapter = useCallback((chapterId: string) => {
    const startRoom = chapterManager.getStartRoom(chapterId)
    setChapter(chapterId)
    if (startRoom) enterRoom(startRoom)
    setPhase('playing')
    navigate('/game')
  }, [navigate, setChapter, enterRoom, setPhase])

  const handleSettings = useCallback(() => {
    startAmbient()
    soundManager.play('sfx_click')
    setShowSettings(true)
  }, [startAmbient])

  return (
    <div className="relative w-screen h-screen overflow-hidden select-none" style={{ background: '#0a0908' }}>
      <div
        className="absolute inset-0"
        style={{
          background: `
            linear-gradient(180deg, rgba(0,0,0,0.4) 0%, rgba(10,9,8,0.2) 40%, rgba(10,9,8,0.8) 100%),
            linear-gradient(90deg,
              #0a0908 0%, #0a0908 8%,
              #1a1612 8%, #1a1612 12%,
              #0f0d0a 12%, #0f0d0a 18%,
              #1a1410 18%, #1a1410 24%,
              #0a0908 24%, #0a0908 30%,
              #15120e 30%, #15120e 36%,
              #0a0908 36%, #0a0908 42%,
              #1f1812 42%, #1f1812 48%,
              #0a0908 48%, #0a0908 55%,
              #15120e 55%, #15120e 60%,
              #0a0908 60%, #0a0908 66%,
              #1a1612 66%, #1a1612 72%,
              #0a0908 72%, #0a0908 78%,
              #12100c 78%, #12100c 84%,
              #0a0908 84%, #0a0908 92%,
              #15120e 92%, #15120e 100%
            )
          `,
        }}
      />

      <div
        className="absolute bottom-0 left-0 right-0 h-[60%] pointer-events-none"
        style={{
          background: `
            linear-gradient(0deg, rgba(10,9,8,1) 0%, rgba(10,9,8,0.6) 30%, transparent 100%)
          `,
        }}
      />

      <div className="absolute inset-0 pointer-events-none">
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

      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
        <div
          className="rounded-full"
          style={{
            width: 300,
            height: 300,
            background: 'radial-gradient(circle, rgba(200,168,110,0.12) 0%, rgba(200,168,110,0.04) 40%, transparent 70%)',
            animation: 'warmPulse 4s ease-in-out infinite',
          }}
        />
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="absolute inset-0 flex flex-col items-center justify-center z-10"
      >
        <motion.div variants={itemVariants} className="text-center mb-12">
          <h1
            className="text-7xl font-serif text-amber-300/90 tracking-[0.15em] mb-3"
            style={{
              textShadow: '0 0 40px rgba(200,168,110,0.3), 0 0 80px rgba(200,168,110,0.1)',
            }}
          >
            旧公寓
          </h1>
          <p className="text-lg font-serif text-amber-200/40 tracking-[0.3em]">探索悬疑</p>
        </motion.div>

        <div className="flex flex-col items-center gap-4 w-72">
          <motion.div variants={itemVariants} className="w-full">
            <button
              onClick={handleStartGame}
              className="w-full py-3.5 rounded font-serif text-base text-amber-100 tracking-wider border border-amber-600/40 transition-all duration-300 hover:border-amber-500/70 hover:shadow-[0_0_25px_rgba(200,168,110,0.25)] flex items-center justify-center gap-2.5"
              style={{
                background: 'linear-gradient(180deg, #2a2218 0%, #1a1612 100%)',
                boxShadow: '0 0 15px rgba(200,168,110,0.1), inset 0 1px 0 rgba(200,168,110,0.1)',
              }}
            >
              <Play size={18} />
              开始游戏
            </button>
          </motion.div>

          {hasSave && (
            <motion.div variants={itemVariants} className="w-full">
              <button
                onClick={handleContinueGame}
                className="w-full py-3.5 rounded font-serif text-base text-amber-200/70 tracking-wider border border-[#5a5040]/50 transition-all duration-300 hover:text-amber-200 hover:border-[#5a5040]/80 hover:shadow-[0_0_20px_rgba(200,168,110,0.15)] flex items-center justify-center gap-2.5"
                style={{
                  background: 'linear-gradient(180deg, #201c16 0%, #15120e 100%)',
                }}
              >
                <Save size={18} />
                继续游戏
              </button>
            </motion.div>
          )}

          <motion.div variants={itemVariants} className="w-full">
            <button
              onClick={handleChapterSelect}
              className="w-full py-3.5 rounded font-serif text-base text-amber-200/70 tracking-wider border border-[#5a5040]/50 transition-all duration-300 hover:text-amber-200 hover:border-[#5a5040]/80 hover:shadow-[0_0_20px_rgba(200,168,110,0.15)] flex items-center justify-center gap-2.5"
              style={{
                background: 'linear-gradient(180deg, #201c16 0%, #15120e 100%)',
              }}
            >
              <BookOpen size={18} />
              章节选择
            </button>
          </motion.div>

          <motion.div variants={itemVariants} className="w-full">
            <button
              onClick={handleSettings}
              className="w-full py-3.5 rounded font-serif text-base text-amber-200/70 tracking-wider border border-[#5a5040]/50 transition-all duration-300 hover:text-amber-200 hover:border-[#5a5040]/80 hover:shadow-[0_0_20px_rgba(200,168,110,0.15)] flex items-center justify-center gap-2.5"
              style={{
                background: 'linear-gradient(180deg, #201c16 0%, #15120e 100%)',
              }}
            >
              <Settings size={18} />
              设置
            </button>
          </motion.div>
        </div>
      </motion.div>

      <ChapterSelect
        isOpen={showChapterSelect}
        onClose={() => setShowChapterSelect(false)}
        onSelectChapter={handleSelectChapter}
      />
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />

      <style>{`
        @keyframes dustFloat {
          0% {
            transform: translateY(0) translateX(0);
            opacity: 0;
          }
          10% {
            opacity: 0.2;
          }
          90% {
            opacity: 0.1;
          }
          100% {
            transform: translateY(-100vh) translateX(${Math.random() > 0.5 ? '' : '-'}25px);
            opacity: 0;
          }
        }

        @keyframes warmPulse {
          0%, 100% {
            opacity: 0.6;
            transform: translate(-50%, -50%) scale(1);
          }
          50% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1.1);
          }
        }
      `}</style>
    </div>
  )
}
