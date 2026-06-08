import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import useGameStore from '@/systems/GameStateManager'
import chapterManager from '@/systems/ChapterManager'
import saveManager from '@/systems/SaveManager'
import analyticsTracker from '@/systems/AnalyticsTracker'
import soundManager from '@/systems/SoundManager'
import RoomView from '@/components/game/RoomView'
import GameHUD from '@/components/game/GameHUD'
import ItemExaminer from '@/components/game/ItemExaminer'
import PuzzleModal from '@/components/puzzle/PuzzleModal'
import NarrativeOverlay from '@/components/game/NarrativeOverlay'
import NotebookPanel from '@/components/notebook/NotebookPanel'

export default function GamePage() {
  const { chapterId, roomId } = useParams<{ chapterId: string; roomId: string }>()
  const navigate = useNavigate()

  const currentChapter = useGameStore((s) => s.currentChapter)
  const currentRoom = useGameStore((s) => s.currentRoom)
  const setChapter = useGameStore((s) => s.setChapter)
  const enterRoom = useGameStore((s) => s.enterRoom)
  const setPhase = useGameStore((s) => s.setPhase)
  const narrativeText = useGameStore((s) => s.narrativeText)
  const setNarrativeText = useGameStore((s) => s.setNarrativeText)
  const clearNarrative = useGameStore((s) => s.clearNarrative)
  const itemBeingExamined = useGameStore((s) => s.itemBeingExamined)
  const examineItem = useGameStore((s) => s.examineItem)
  const stopExamining = useGameStore((s) => s.stopExamining)
  const activePuzzleId = useGameStore((s) => s.activePuzzleId)
  const setActivePuzzle = useGameStore((s) => s.setActivePuzzle)
  const clearActivePuzzle = useGameStore((s) => s.clearActivePuzzle)
  const incrementPlayTime = useGameStore((s) => s.incrementPlayTime)

  const [notebookOpen, setNotebookOpen] = useState(false)
  const [doorLockedMessage, setDoorLockedMessage] = useState<string | null>(null)

  const prevRoomRef = useRef<string | null>(null)
  const autoSaveRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const playTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const effectiveChapterId = chapterId || currentChapter
  const effectiveRoomId = roomId || currentRoom

  const roomConfig = useMemo(
    () => chapterManager.getRoom(effectiveChapterId, effectiveRoomId),
    [effectiveChapterId, effectiveRoomId],
  )

  useEffect(() => {
    if (chapterId && chapterId !== currentChapter) {
      setChapter(chapterId)
    }
    if (roomId && roomId !== currentRoom) {
      enterRoom(roomId)
    }
    setPhase('playing')
  }, [chapterId, roomId, currentChapter, currentRoom, setChapter, enterRoom, setPhase])

  useEffect(() => {
    analyticsTracker.startChapter(effectiveChapterId)
  }, [effectiveChapterId])

  useEffect(() => {
    if (!roomConfig) return
    if (prevRoomRef.current === effectiveRoomId) return
    prevRoomRef.current = effectiveRoomId

    soundManager.playAmbient(roomConfig.ambientSound)

    const enterEvents = roomConfig.narrativeEvents.filter(
      (e) => e.trigger === 'enter' || e.trigger === 'room_enter',
    )
    enterEvents.forEach((event) => {
      setTimeout(() => {
        setNarrativeText(event.text)
        if (event.soundEffect) {
          soundManager.play(event.soundEffect)
        }
      }, event.delay)
    })
  }, [effectiveRoomId, roomConfig, setNarrativeText])

  useEffect(() => {
    playTimerRef.current = setInterval(() => {
      incrementPlayTime(1000)
    }, 1000)
    return () => {
      if (playTimerRef.current) clearInterval(playTimerRef.current)
    }
  }, [incrementPlayTime])

  useEffect(() => {
    autoSaveRef.current = setInterval(() => {
      const state = useGameStore.getState()
      saveManager.save(state)
    }, 30000)
    return () => {
      if (autoSaveRef.current) clearInterval(autoSaveRef.current)
    }
  }, [])

  const handleHotspotClick = useCallback(
    (hotspotId: string, type: string, targetId: string) => {
      soundManager.play('sfx_click')

      switch (type) {
        case 'item':
          examineItem(targetId)
          break

        case 'examine':
          setActivePuzzle(targetId)
          break

        case 'door': {
          const door = chapterManager.getDoorByHotspot(effectiveChapterId, effectiveRoomId, hotspotId)
          if (!door) return

          if (door.locked) {
            const puzzle = door.lockPuzzleId
              ? chapterManager.getPuzzle(door.lockPuzzleId)
              : null
            soundManager.play('sfx_lock_fail')
            setDoorLockedMessage(
              puzzle
                ? `此门被谜题锁住: ${puzzle.description}`
                : '此门被锁住了',
            )
            setTimeout(() => setDoorLockedMessage(null), 3000)
          } else {
            soundManager.play('sfx_door_creak')
            navigate(`/game/${effectiveChapterId}/${door.targetRoom}`)
          }
          break
        }

        case 'narrative':
          setNarrativeText(targetId)
          break
      }
    },
    [effectiveChapterId, effectiveRoomId, navigate, examineItem, setActivePuzzle, setNarrativeText],
  )

  const handleItemCollect = useCallback(() => {
    soundManager.play('sfx_item_pickup')
    stopExamining()
  }, [stopExamining])

  const handleItemClose = useCallback(() => {
    stopExamining()
  }, [stopExamining])

  const handlePuzzleSolve = useCallback(() => {
    if (activePuzzleId) {
      const puzzle = chapterManager.getPuzzle(activePuzzleId)
      if (puzzle?.narrativeOnSolve) {
        setNarrativeText(puzzle.narrativeOnSolve)
      }

      if (puzzle?.chapter && puzzle?.room) {
        const chapter = chapterManager.getChapter(puzzle.chapter)
        if (chapter) {
          chapter.rooms.forEach(room => {
            room.doors.forEach(door => {
              if (door.lockPuzzleId === activePuzzleId) {
                (door as { locked: boolean }).locked = false
              }
            })
          })
        }
      }

      const chapterId = effectiveChapterId
      const state = useGameStore.getState()
      if (chapterManager.isChapterComplete(chapterId, state.puzzleStates)) {
        analyticsTracker.completeChapter(chapterId)

        const allChapters = chapterManager.getChapterList()
        const currentIndex = allChapters.findIndex(c => c.id === chapterId)
        const nextChapter = allChapters[currentIndex + 1]
        if (nextChapter) {
          state.unlockChapter(nextChapter.id)
        }

        setTimeout(() => {
          clearActivePuzzle()
          navigate(`/settlement/${chapterId}`)
        }, 2500)
      } else {
        clearActivePuzzle()
      }
    } else {
      clearActivePuzzle()
    }
  }, [activePuzzleId, effectiveChapterId, clearActivePuzzle, setNarrativeText, navigate])

  const handlePuzzleClose = useCallback(() => {
    clearActivePuzzle()
  }, [clearActivePuzzle])

  const handlePuzzleHint = useCallback(() => {
    analyticsTracker.recordHintUsed()
  }, [])

  const handleNotebookClick = useCallback(() => {
    soundManager.play('sfx_notebook')
    setNotebookOpen((prev) => !prev)
  }, [])

  const handleHintClick = useCallback(() => {
    if (activePuzzleId) return
  }, [activePuzzleId])

  const handleMenuClick = useCallback(() => {
    soundManager.play('sfx_click')
    const state = useGameStore.getState()
    saveManager.save(state)
    navigate('/')
  }, [navigate])

  const handleNarrativeComplete = useCallback(() => {
    clearNarrative()
  }, [clearNarrative])

  if (!roomConfig) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[#0a0908]">
        <p className="font-serif text-amber-200/50 text-lg">加载中...</p>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-[#0a0908] select-none">
      <RoomView
        chapterId={effectiveChapterId}
        roomId={effectiveRoomId}
        onHotspotClick={handleHotspotClick}
      />

      <GameHUD
        onNotebookClick={handleNotebookClick}
        onHintClick={handleHintClick}
        onMenuClick={handleMenuClick}
      />

      <AnimatePresence>
        {doorLockedMessage && (
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 px-8 py-4 rounded-lg border border-red-800/50 bg-black/80 backdrop-blur-sm">
            <p className="font-serif text-red-300/90 text-sm text-center animate-shake">
              {doorLockedMessage}
            </p>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {narrativeText && (
          <NarrativeOverlay
            text={narrativeText}
            onComplete={handleNarrativeComplete}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {itemBeingExamined && (
          <ItemExaminer
            itemId={itemBeingExamined}
            onClose={handleItemClose}
            onCollect={handleItemCollect}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {activePuzzleId && (
          <PuzzleModal
            puzzleId={activePuzzleId}
            onSolve={handlePuzzleSolve}
            onClose={handlePuzzleClose}
            onUseHint={handlePuzzleHint}
          />
        )}
      </AnimatePresence>

      <NotebookPanel
        isOpen={notebookOpen}
        onClose={() => setNotebookOpen(false)}
      />
    </div>
  )
}
