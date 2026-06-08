import { useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Home } from 'lucide-react'
import useGameStore from '@/systems/GameStateManager'
import chapterManager from '@/systems/ChapterManager'
import type { SettlementData } from '@/types'

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

const ratingStyles: Record<string, { bg: string; border: string; text: string; glow?: string }> = {
  S: {
    bg: 'linear-gradient(135deg, #f59e0b, #fbbf24, #d97706)',
    border: '#f59e0b',
    text: '#451a03',
    glow: '0 0 40px 8px rgba(245, 158, 11, 0.5)',
  },
  A: {
    bg: 'linear-gradient(135deg, #9ca3af, #e5e7eb, #6b7280)',
    border: '#9ca3af',
    text: '#1f2937',
  },
  B: {
    bg: 'linear-gradient(135deg, #b45309, #d97706, #92400e)',
    border: '#b45309',
    text: '#451a03',
  },
  C: {
    bg: 'linear-gradient(135deg, #374151, #4b5563, #1f2937)',
    border: '#4b5563',
    text: '#d1d5db',
  },
}

const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.2, delayChildren: 0.3 },
  },
}

const staggerItem = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
}

export default function SettlementPage() {
  const navigate = useNavigate()
  const { chapterId } = useParams<{ chapterId: string }>()
  const notebook = useGameStore((s) => s.notebook)
  const puzzleStates = useGameStore((s) => s.puzzleStates)
  const setPhase = useGameStore((s) => s.setPhase)
  const setChapter = useGameStore((s) => s.setChapter)
  const enterRoom = useGameStore((s) => s.enterRoom)

  const chapter = chapterManager.getChapter(chapterId || '')

  const settlement: SettlementData | null = useMemo(() => {
    if (!chapterId) return null

    const chapterPuzzles = Object.values(puzzleStates).filter((ps) => {
      const config = chapterManager.getPuzzle(ps.id)
      return config?.chapter === chapterId
    })

    const totalRetries = chapterPuzzles.reduce((sum, ps) => sum + ps.failCount, 0)
    const totalHints = chapterPuzzles.reduce((sum, ps) => sum + ps.hintsUsed, 0)

    const chapterClues = notebook.filter((c) => c.chapter === chapterId)
    const totalCluesInChapter = chapter?.rooms.reduce((sum, room) => {
      return sum + room.items.length * 2
    }, 0) || 1

    const completionTime = 300000

    return chapterManager.calculateSettlement(
      chapterId,
      completionTime,
      totalRetries,
      totalHints,
      chapterClues.length,
      totalCluesInChapter,
    )
  }, [chapterId, notebook, puzzleStates, chapter])

  if (!settlement || !chapter) return null

  const style = ratingStyles[settlement.rating]

  const handleNextChapter = () => {
    const allChapters = chapterManager.getChapterList()
    const currentIndex = allChapters.findIndex((c) => c.id === chapterId)
    const nextChapter = allChapters[currentIndex + 1]
    if (nextChapter) {
      setChapter(nextChapter.id)
      enterRoom(nextChapter.startRoom)
      setPhase('playing')
      navigate(`/chapter/${nextChapter.id}`)
    }
  }

  const handleReturnMenu = () => {
    setPhase('menu')
    navigate('/')
  }

  const clueRate = settlement.totalClues > 0
    ? Math.round((settlement.cluesFound / settlement.totalClues) * 100)
    : 0

  return (
    <div className="min-h-screen bg-[#1a1410] flex items-center justify-center p-4">
      <motion.div
        className="relative w-full max-w-md"
        variants={staggerContainer}
        initial="hidden"
        animate="show"
      >
        <div className="relative bg-[#f5e6c8] rounded-sm shadow-2xl px-8 py-10 overflow-hidden">
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              boxShadow: 'inset 0 0 40px 10px rgba(139, 109, 63, 0.3)',
              borderRadius: '2px',
            }}
          />
          <div
            className="absolute inset-0 pointer-events-none opacity-20"
            style={{
              backgroundImage:
                'repeating-linear-gradient(0deg, transparent, transparent 28px, rgba(139,109,63,0.15) 28px, rgba(139,109,63,0.15) 29px)',
            }}
          />

          <motion.div variants={staggerItem} className="relative text-center mb-8">
            <h1 className="font-serif text-2xl text-[#3d2b1f] tracking-wider">
              {chapter.title}
            </h1>
            <div className="mt-2 w-24 h-px bg-[#8b6d3f]/40 mx-auto" />
          </motion.div>

          <motion.div
            variants={staggerItem}
            className="relative flex justify-center mb-8"
          >
            <div
              className="w-28 h-28 rounded-full flex items-center justify-center border-4 relative"
              style={{
                background: style.bg,
                borderColor: style.border,
                boxShadow: style.glow,
              }}
            >
              <span
                className="font-serif text-5xl font-bold"
                style={{ color: style.text }}
              >
                {settlement.rating}
              </span>
              <div
                className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full"
                style={{
                  background: 'linear-gradient(135deg, #8b0000, #b91c1c)',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.4)',
                }}
              />
            </div>
          </motion.div>

          <motion.div
            variants={staggerItem}
            className="relative space-y-3 mb-10 font-serif text-[#3d2b1f]"
          >
            <div className="flex justify-between items-center border-b border-[#8b6d3f]/20 pb-2">
              <span className="text-sm opacity-70">完成时间</span>
              <span className="text-lg font-bold tracking-wider">
                {formatTime(settlement.completionTime)}
              </span>
            </div>
            <div className="flex justify-between items-center border-b border-[#8b6d3f]/20 pb-2">
              <span className="text-sm opacity-70">重试次数</span>
              <span className="text-lg font-bold tracking-wider">
                {settlement.retryCount}
              </span>
            </div>
            <div className="flex justify-between items-center border-b border-[#8b6d3f]/20 pb-2">
              <span className="text-sm opacity-70">使用提示</span>
              <span className="text-lg font-bold tracking-wider">
                {settlement.hintsUsed}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm opacity-70">线索发现率</span>
              <span className="text-lg font-bold tracking-wider">
                {settlement.cluesFound}/{settlement.totalClues} ({clueRate}%)
              </span>
            </div>
          </motion.div>

          <motion.div
            variants={staggerItem}
            className="relative flex flex-col gap-3"
          >
            <button
              onClick={handleNextChapter}
              className="w-full py-3 bg-[#3d2b1f] hover:bg-[#5a3f2e] text-[#f5e6c8] font-serif rounded transition-colors duration-200 flex items-center justify-center gap-2"
            >
              下一章
              <ArrowRight size={16} />
            </button>
            <button
              onClick={handleReturnMenu}
              className="w-full py-3 bg-transparent hover:bg-[#3d2b1f]/10 text-[#3d2b1f] font-serif rounded border border-[#3d2b1f]/30 transition-colors duration-200 flex items-center justify-center gap-2"
            >
              <Home size={16} />
              返回主界面
            </button>
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
}
