import { motion, AnimatePresence } from 'framer-motion'
import { X, Lock } from 'lucide-react'
import useGameStore from '@/systems/GameStateManager'
import chapterManager from '@/systems/ChapterManager'

interface ChapterSelectProps {
  isOpen: boolean
  onClose: () => void
  onSelectChapter: (chapterId: string) => void
}

export default function ChapterSelect({ isOpen, onClose, onSelectChapter }: ChapterSelectProps) {
  const chaptersUnlocked = useGameStore((s) => s.chaptersUnlocked)

  const chapters = chapterManager.getChapterList()

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-50 flex items-center justify-center"
        >
          <div className="absolute inset-0 bg-black/85" onClick={onClose} />

          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="relative w-full max-w-lg mx-4 rounded-lg border border-[#5a5040]/50 overflow-hidden"
            style={{
              background: 'linear-gradient(145deg, #2a2520 0%, #1a1612 40%, #252018 100%)',
            }}
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-amber-200/40 hover:text-amber-200 transition-colors z-10"
            >
              <X size={20} />
            </button>

            <div className="px-6 pt-6 pb-4 border-b border-[#5a5040]/20">
              <h2 className="font-serif text-lg text-amber-200/90 tracking-wider text-center">章节选择</h2>
            </div>

            <div className="p-6 space-y-3">
              {chapters.map((chapter, index) => {
                const isUnlocked = chaptersUnlocked.includes(chapter.id)

                return (
                  <motion.button
                    key={chapter.id}
                    onClick={() => isUnlocked && onSelectChapter(chapter.id)}
                    disabled={!isUnlocked}
                    className={`w-full text-left px-5 py-4 rounded border transition-all duration-300 ${
                      isUnlocked
                        ? 'border-[#5a5040]/50 hover:border-amber-600/50 hover:shadow-[0_0_20px_rgba(200,168,110,0.15)] cursor-pointer'
                        : 'border-[#3a3530]/30 cursor-not-allowed opacity-50'
                    }`}
                    style={{
                      background: isUnlocked
                        ? 'linear-gradient(135deg, #201c16 0%, #1a1612 100%)'
                        : 'linear-gradient(135deg, #161412 0%, #100e0c 100%)',
                    }}
                    whileHover={isUnlocked ? { scale: 1.01 } : undefined}
                    whileTap={isUnlocked ? { scale: 0.99 } : undefined}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-10 h-10 rounded flex items-center justify-center font-serif text-lg shrink-0 ${
                          isUnlocked
                            ? 'text-amber-300 border border-amber-600/40 bg-amber-900/20'
                            : 'text-amber-200/20 border border-[#3a3530]/30 bg-[#1a1612]'
                        }`}
                      >
                        {isUnlocked ? index + 1 : <Lock size={16} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`font-serif tracking-wide ${isUnlocked ? 'text-amber-200/90' : 'text-amber-200/30'}`}>
                          {chapter.title}
                        </p>
                        <p className={`text-xs mt-0.5 ${isUnlocked ? 'text-amber-200/50' : 'text-amber-200/15'}`}>
                          {chapter.subtitle}
                        </p>
                      </div>
                      {isUnlocked && (
                        <div className="text-[10px] text-amber-400/40 shrink-0">
                          难度 {'★'.repeat(Math.round(chapter.difficulty))}
                        </div>
                      )}
                    </div>
                  </motion.button>
                )
              })}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
