import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, BookOpen, Link2 } from 'lucide-react'
import useGameStore from '@/systems/GameStateManager'
import chapterManager from '@/systems/ChapterManager'
import type { Clue } from '@/types'

interface NotebookPanelProps {
  isOpen: boolean
  onClose: () => void
}

type TabKey = 'clues' | 'deduction'

export default function NotebookPanel({ isOpen, onClose }: NotebookPanelProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('clues')
  const notebook = useGameStore((s) => s.notebook)
  const clueLinks = useGameStore((s) => s.clueLinks)
  const addClueLink = useGameStore((s) => s.addClueLink)
  const removeClueLink = useGameStore((s) => s.removeClueLink)
  const [selectedPair, setSelectedPair] = useState<[string, string] | null>(null)

  const handleLinkClues = useCallback(() => {
    if (!selectedPair) return
    const [from, to] = selectedPair
    const alreadyLinked = clueLinks.some(
      (l) =>
        (l.from === from && l.to === to) ||
        (l.from === to && l.to === from)
    )
    if (!alreadyLinked) {
      addClueLink(from, to)
    }
    setSelectedPair(null)
  }, [selectedPair, clueLinks, addClueLink])

  const handleUnlink = useCallback(
    (from: string, to: string) => {
      removeClueLink(from, to)
    },
    [removeClueLink]
  )

  const toggleClueSelection = useCallback(
    (clueId: string) => {
      if (!selectedPair) {
        setSelectedPair([clueId, ''])
        return
      }
      const [first] = selectedPair
      if (first === clueId) {
        setSelectedPair(null)
        return
      }
      if (!selectedPair[1]) {
        setSelectedPair([first, clueId])
        return
      }
      setSelectedPair([clueId, ''])
    },
    [selectedPair]
  )

  const getLinkedPairs = useCallback(() => {
    const seen = new Set<string>()
    return clueLinks
      .map((link) => {
        const key = [link.from, link.to].sort().join('-')
        if (seen.has(key)) return null
        seen.add(key)
        const fromClue = notebook.find((c) => c.id === link.from)
        const toClue = notebook.find((c) => c.id === link.to)
        if (!fromClue || !toClue) return null
        return { from: fromClue, to: toClue }
      })
      .filter(Boolean) as { from: Clue; to: Clue }[]
  }, [clueLinks, notebook])

  const formatTimestamp = (ts: number) => {
    const d = new Date(ts)
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/40"
            onClick={onClose}
          />

          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed top-0 right-0 bottom-0 z-50 w-full max-w-sm flex flex-col border-l border-[#3a3020]/60"
            style={{ background: '#1a1612' }}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#3a3020]/40">
              <div className="flex items-center gap-2">
                <BookOpen size={18} className="text-amber-300/60" />
                <span className="font-serif text-amber-200/90 tracking-wide text-sm">笔记</span>
              </div>
              <button
                onClick={onClose}
                className="text-amber-200/40 hover:text-amber-200 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex border-b border-[#3a3020]/40">
              {(
                [
                  ['clues', '线索'],
                  ['deduction', '推理'],
                ] as [TabKey, string][]
              ).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`flex-1 py-3 font-serif text-xs tracking-wider transition-colors ${
                    activeTab === key
                      ? 'text-amber-300 border-b-2 border-amber-500/60'
                      : 'text-amber-200/40 hover:text-amber-200/70'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto">
              <AnimatePresence mode="wait">
                {activeTab === 'clues' ? (
                  <motion.div
                    key="clues"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="p-4 space-y-3"
                  >
                    {notebook.length === 0 && (
                      <p className="text-center text-amber-200/30 text-xs font-serif py-8">
                        暂无线索
                      </p>
                    )}
                    {notebook.map((clue) => {
                      const item = chapterManager.getItem(clue.sourceItem)
                      return (
                        <motion.div
                          key={clue.id}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="px-4 py-3 rounded border border-transparent hover:border-amber-700/40 transition-colors"
                          style={{ background: '#2a2218' }}
                        >
                          <p className="font-serif text-amber-200/80 text-sm leading-relaxed">
                            {clue.text}
                          </p>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-amber-200/30">
                              {item?.name || clue.sourceItem}
                            </span>
                            <span className="text-xs text-amber-200/20 font-mono">
                              {formatTimestamp(clue.timestamp)}
                            </span>
                          </div>
                        </motion.div>
                      )
                    })}
                  </motion.div>
                ) : (
                  <motion.div
                    key="deduction"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="p-4 space-y-3"
                  >
                    {notebook.length < 2 && (
                      <p className="text-center text-amber-200/30 text-xs font-serif py-8">
                        线索不足，无法推理
                      </p>
                    )}

                    {notebook.length >= 2 && (
                      <div className="mb-4">
                        <p className="text-xs text-amber-200/40 font-serif mb-3">
                          选择两条线索进行关联:
                        </p>
                        <div className="space-y-2">
                          {notebook.map((clue) => {
                            const isSelected =
                              selectedPair?.includes(clue.id) || false
                            return (
                              <button
                                key={clue.id}
                                onClick={() => toggleClueSelection(clue.id)}
                                className={`w-full text-left px-3 py-2 rounded border transition-all ${
                                  isSelected
                                    ? 'border-amber-600/60 bg-amber-900/20'
                                    : 'border-transparent hover:border-amber-800/30'
                                }`}
                                style={{
                                  background: isSelected
                                    ? undefined
                                    : '#2a2218',
                                }}
                              >
                                <p className="text-xs text-amber-200/70 font-serif truncate">
                                  {clue.text}
                                </p>
                              </button>
                            )
                          })}
                        </div>

                        {selectedPair && selectedPair[1] && (
                          <button
                            onClick={handleLinkClues}
                            className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 rounded border border-amber-800/40 text-amber-300/70 hover:text-amber-300 hover:border-amber-700/60 bg-amber-950/20 transition-all font-serif text-xs"
                          >
                            <Link2 size={14} />
                            <span>关联线索</span>
                          </button>
                        )}
                      </div>
                    )}

                    {getLinkedPairs().length > 0 && (
                      <div>
                        <p className="text-xs text-amber-200/40 font-serif mb-2">
                          已关联:
                        </p>
                        <div className="space-y-2">
                          {getLinkedPairs().map(({ from, to }) => (
                            <div
                              key={`${from.id}-${to.id}`}
                              className="px-3 py-2 rounded border border-amber-900/30"
                              style={{ background: '#221c14' }}
                            >
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-amber-200/60 font-serif truncate flex-1">
                                  {from.text.slice(0, 20)}...
                                </span>
                                <Link2
                                  size={12}
                                  className="text-amber-500/50 flex-shrink-0"
                                />
                                <span className="text-xs text-amber-200/60 font-serif truncate flex-1 text-right">
                                  {to.text.slice(0, 20)}...
                                </span>
                              </div>
                              <button
                                onClick={() => handleUnlink(from.id, to.id)}
                                className="mt-1 text-xs text-red-400/40 hover:text-red-400/80 transition-colors"
                              >
                                取消关联
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
