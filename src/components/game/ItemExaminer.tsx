import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Rotate3D, PackagePlus } from 'lucide-react'
import useGameStore from '@/systems/GameStateManager'
import chapterManager from '@/systems/ChapterManager'
import type { Item } from '@/types'

interface ItemExaminerProps {
  itemId: string
  onClose: () => void
  onCollect: () => void
}

export default function ItemExaminer({ itemId, onClose, onCollect }: ItemExaminerProps) {
  const [flipped, setFlipped] = useState(false)
  const addItem = useGameStore((s) => s.addItem)
  const addClue = useGameStore((s) => s.addClue)
  const currentChapter = useGameStore((s) => s.currentChapter)
  const currentRoom = useGameStore((s) => s.currentRoom)
  const inventory = useGameStore((s) => s.inventory)

  const item: Item | null = useMemo(
    () => chapterManager.getItem(itemId),
    [itemId],
  )

  if (!item) return null

  const alreadyCollected = inventory.includes(itemId)

  const handleCollect = () => {
    if (alreadyCollected) return
    addItem(itemId)
    item.clues.forEach((clueText, i) => {
      addClue({
        id: `${itemId}_clue_${i}`,
        text: clueText,
        sourceItem: itemId,
        sourceRoom: currentRoom,
        chapter: currentChapter,
        timestamp: Date.now(),
        linkedClues: [],
      })
    })
    if (flipped && item.backsideClue) {
      addClue({
        id: `${itemId}_backside_clue`,
        text: item.backsideClue,
        sourceItem: itemId,
        sourceRoom: currentRoom,
        chapter: currentChapter,
        timestamp: Date.now(),
        linkedClues: [],
      })
    }
    onCollect()
  }

  const displayText = flipped && item.backsideText
    ? item.backsideText
    : item.examineText || item.description

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div
          className="absolute inset-0 bg-black/70"
          onClick={onClose}
        />

        <motion.div
          className="relative z-10 w-full max-w-md mx-4 rounded-lg overflow-hidden"
          style={{
            backgroundColor: '#f5e6c8',
            boxShadow: 'inset 0 0 30px rgba(61, 43, 31, 0.2), 0 10px 40px rgba(0, 0, 0, 0.5)',
          }}
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.85, opacity: 0 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
        >
          <div className="p-6" style={{ color: '#3d2b1f' }}>
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-xl font-serif font-bold tracking-wide">
                {item.name}
              </h3>
              <button
                onClick={onClose}
                className="p-1 rounded hover:bg-[#3d2b1f]/10 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="min-h-[120px] mb-6">
              <AnimatePresence mode="wait">
                <motion.p
                  key={flipped ? 'back' : 'front'}
                  className="font-serif text-sm leading-relaxed"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  {displayText}
                </motion.p>
              </AnimatePresence>
            </div>

            <div className="flex items-center gap-3">
              {item.backsideText && (
                <button
                  onClick={() => setFlipped((f) => !f)}
                  className="flex items-center gap-2 px-4 py-2 rounded text-sm font-medium transition-colors"
                  style={{
                    backgroundColor: flipped ? '#3d2b1f' : '#3d2b1f15',
                    color: flipped ? '#f5e6c8' : '#3d2b1f',
                  }}
                >
                  <Rotate3D size={16} />
                  {flipped ? 'Front' : 'Flip'}
                </button>
              )}

              <button
                onClick={handleCollect}
                disabled={alreadyCollected}
                className="flex items-center gap-2 px-4 py-2 rounded text-sm font-medium transition-colors ml-auto disabled:opacity-40"
                style={{
                  backgroundColor: alreadyCollected ? '#3d2b1f20' : '#3d2b1f',
                  color: alreadyCollected ? '#3d2b1f' : '#f5e6c8',
                }}
              >
                <PackagePlus size={16} />
                {alreadyCollected ? 'Collected' : 'Collect'}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
