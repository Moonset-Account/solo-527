import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, SkipForward, Settings2, BarChart3, Volume2 } from 'lucide-react'
import useGameStore from '@/systems/GameStateManager'
import chapterManager from '@/systems/ChapterManager'
import analyticsTracker from '@/systems/AnalyticsTracker'
import soundManager from '@/systems/SoundManager'
import soundsData from '@/config/sounds.json'
import type { SoundConfig } from '@/types'

const sounds = soundsData as SoundConfig[]

interface DebugPanelProps {
  isOpen: boolean
  onClose: () => void
}

export default function DebugPanel({ isOpen, onClose }: DebugPanelProps) {
  const currentChapter = useGameStore((s) => s.currentChapter)
  const currentRoom = useGameStore((s) => s.currentRoom)
  const hintPoints = useGameStore((s) => s.hintPoints)
  const chaptersUnlocked = useGameStore((s) => s.chaptersUnlocked)
  const setChapter = useGameStore((s) => s.setChapter)
  const enterRoom = useGameStore((s) => s.enterRoom)
  const setHintPoints = useGameStore((s) => s.setHintPoints)
  const unlockChapter = useGameStore((s) => s.unlockChapter)
  const setPhase = useGameStore((s) => s.setPhase)

  const [hintInput, setHintInput] = useState(String(hintPoints))

  useEffect(() => {
    setHintInput(String(hintPoints))
  }, [hintPoints])

  const allChapters = chapterManager.getChapterList()

  const analyticsData = analyticsTracker.getData()

  const navigateToRoom = useCallback((chapterId: string, roomId: string) => {
    setChapter(chapterId)
    enterRoom(roomId)
    setPhase('playing')
  }, [setChapter, enterRoom, setPhase])

  const handleUnlockAllChapters = useCallback(() => {
    allChapters.forEach((ch) => unlockChapter(ch.id))
  }, [allChapters, unlockChapter])

  const handleHintSubmit = useCallback(() => {
    const n = parseInt(hintInput, 10)
    if (!isNaN(n) && n >= 0) {
      setHintPoints(n)
    }
  }, [hintInput, setHintPoints])

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed top-0 right-0 bottom-0 w-96 z-50 flex flex-col overflow-hidden"
          style={{
            background: 'linear-gradient(180deg, rgba(18,16,14,0.97) 0%, rgba(10,9,8,0.97) 100%)',
            borderLeft: '1px solid rgba(200,168,110,0.15)',
          }}
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#c8a86e]/15">
            <h2 className="font-serif text-lg text-amber-200/90 tracking-wider">调试面板</h2>
            <button
              onClick={onClose}
              className="text-amber-200/40 hover:text-amber-200 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6 scrollbar-thin">
            <section>
              <div className="flex items-center gap-2 mb-3">
                <SkipForward size={16} className="text-amber-400/70" />
                <h3 className="font-serif text-sm text-amber-300/80 tracking-wide">关卡跳转</h3>
              </div>
              <div className="space-y-3">
                {allChapters.map((chapter) => (
                  <div key={chapter.id}>
                    <p className="text-xs text-amber-200/50 mb-1.5 font-serif">
                      {chapter.title} — {chapter.subtitle}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {chapter.rooms.map((room) => (
                        <button
                          key={room.id}
                          onClick={() => navigateToRoom(chapter.id, room.id)}
                          className={`px-2.5 py-1 text-xs rounded border transition-all duration-200 ${
                            currentChapter === chapter.id && currentRoom === room.id
                              ? 'border-amber-500/60 text-amber-200 bg-amber-900/30'
                              : 'border-[#5a5040]/40 text-amber-200/50 hover:text-amber-200 hover:border-[#5a5040]/80 hover:bg-amber-900/15'
                          }`}
                        >
                          {room.name}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <div className="flex items-center gap-2 mb-3">
                <Settings2 size={16} className="text-amber-400/70" />
                <h3 className="font-serif text-sm text-amber-300/80 tracking-wide">数值调整</h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <label className="text-xs text-amber-200/50 w-16 shrink-0">提示点数</label>
                  <input
                    type="number"
                    value={hintInput}
                    onChange={(e) => setHintInput(e.target.value)}
                    className="w-20 px-2 py-1 text-xs text-amber-200 rounded border border-[#5a5040]/50 bg-[#1a1612] focus:outline-none focus:border-amber-600/40"
                  />
                  <button
                    onClick={handleHintSubmit}
                    className="px-3 py-1 text-xs rounded border border-[#5a5040]/60 text-amber-200/60 hover:text-amber-200 hover:border-[#5a5040] transition-colors"
                  >
                    设置
                  </button>
                </div>
                <button
                  onClick={handleUnlockAllChapters}
                  className="px-4 py-1.5 text-xs rounded border border-amber-700/40 text-amber-300/70 hover:text-amber-300 hover:border-amber-600/60 bg-amber-950/20 transition-all"
                >
                  解锁全部章节
                </button>
              </div>
            </section>

            <section>
              <div className="flex items-center gap-2 mb-3">
                <BarChart3 size={16} className="text-amber-400/70" />
                <h3 className="font-serif text-sm text-amber-300/80 tracking-wide">行为数据</h3>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-amber-200/50">
                  <span>教程跳过</span>
                  <span className="text-amber-200/70">{analyticsData.tutorialSkipped ? '是' : '否'}</span>
                </div>
                <div className="flex justify-between text-amber-200/50">
                  <span>教程完成时间</span>
                  <span className="text-amber-200/70">
                    {analyticsData.tutorialCompletedAt
                      ? new Date(analyticsData.tutorialCompletedAt).toLocaleString()
                      : '未完成'}
                  </span>
                </div>
                <div className="text-amber-200/50">
                  <span>步骤失败</span>
                  {analyticsData.stepFailures.length === 0 ? (
                    <p className="text-amber-200/30 mt-1 pl-2">无记录</p>
                  ) : (
                    <div className="mt-1 pl-2 space-y-1">
                      {analyticsData.stepFailures.map((f, i) => (
                        <div key={i} className="text-amber-200/40">
                          {f.chapterId}/{f.roomId}/{f.stepId}: <span className="text-amber-200/60">{f.failCount}次</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="text-amber-200/50">
                  <span>谜题重试</span>
                  {analyticsData.puzzleRetries.length === 0 ? (
                    <p className="text-amber-200/30 mt-1 pl-2">无记录</p>
                  ) : (
                    <div className="mt-1 pl-2 space-y-1">
                      {analyticsData.puzzleRetries.map((r, i) => (
                        <div key={i} className="text-amber-200/40">
                          {r.puzzleId}: <span className="text-amber-200/60">{r.retryCount}次</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex justify-between text-amber-200/50">
                  <span>提示使用总计</span>
                  <span className="text-amber-200/70">{analyticsData.totalHintsUsed}</span>
                </div>
              </div>
            </section>

            <section>
              <div className="flex items-center gap-2 mb-3">
                <Volume2 size={16} className="text-amber-400/70" />
                <h3 className="font-serif text-sm text-amber-300/80 tracking-wide">音效测试</h3>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {sounds.map((sound) => (
                  <button
                    key={sound.id}
                    onClick={() => soundManager.play(sound.id)}
                    className="px-2 py-1 text-[10px] rounded border border-[#5a5040]/40 text-amber-200/40 hover:text-amber-200 hover:border-[#5a5040]/80 transition-colors"
                  >
                    {sound.id}
                  </button>
                ))}
              </div>
            </section>
          </div>

          <div className="px-5 py-3 border-t border-[#c8a86e]/10">
            <p className="text-[10px] text-amber-200/20 text-center">Current: {currentChapter} / {currentRoom}</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
