import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import RoomView from '@/components/game/RoomView'
import ItemExaminer from '@/components/game/ItemExaminer'
import NotebookPanel from '@/components/notebook/NotebookPanel'
import TutorialOverlay from '@/components/tutorial/TutorialOverlay'
import useGameStore from '@/systems/GameStateManager'
import analyticsTracker from '@/systems/AnalyticsTracker'
import tutorialConfig from '@/config/tutorial.json'
import type { TutorialStep } from '@/types'

export default function TutorialPage() {
  const navigate = useNavigate()
  const completeTutorial = useGameStore((s) => s.completeTutorial)
  const skipTutorial = useGameStore((s) => s.skipTutorial)
  const setPhase = useGameStore((s) => s.setPhase)
  const setChapter = useGameStore((s) => s.setChapter)
  const enterRoom = useGameStore((s) => s.enterRoom)
  const examineItem = useGameStore((s) => s.examineItem)
  const stopExamining = useGameStore((s) => s.stopExamining)
  const itemBeingExamined = useGameStore((s) => s.itemBeingExamined)
  const notebook = useGameStore((s) => s.notebook)

  const [steps] = useState<TutorialStep[]>(
    () => tutorialConfig.steps as TutorialStep[]
  )
  const [currentStep, setCurrentStep] = useState(0)
  const [notebookOpen, setNotebookOpen] = useState(false)
  const [collectToast, setCollectToast] = useState<string | null>(null)

  const goToChapter1 = useCallback(() => {
    setChapter('chapter1')
    enterRoom('room_201')
    setPhase('playing')
    navigate('/game/chapter1/room_201')
  }, [navigate, setChapter, enterRoom, setPhase])

  const handleNext = useCallback(() => {
    setCurrentStep((prev) => prev + 1)
  }, [])

  const handleSkip = useCallback(() => {
    skipTutorial()
    analyticsTracker.setTutorialSkipped(true)
    goToChapter1()
  }, [skipTutorial, goToChapter1])

  const handleComplete = useCallback(() => {
    completeTutorial()
    analyticsTracker.setTutorialCompleted()
    goToChapter1()
  }, [completeTutorial, goToChapter1])

  const handleHotspotClick = useCallback(
    (hotspotId: string, type: string, targetId: string) => {
      if (currentStep < steps.length && steps[currentStep].highlightTarget === hotspotId) {
        handleNext()
      }
      if (type === 'item') {
        examineItem(targetId)
      }
      if (type === 'door') {
        completeTutorial()
        analyticsTracker.setTutorialCompleted()
        goToChapter1()
      }
    },
    [currentStep, steps, handleNext, examineItem, completeTutorial, goToChapter1],
  )

  const handleItemCollect = useCallback(() => {
    setCollectToast('线索已收入笔记')
    setNotebookOpen(true)
    setTimeout(() => setCollectToast(null), 2000)
    stopExamining()
  }, [stopExamining])

  const handleItemClose = useCallback(() => {
    stopExamining()
  }, [stopExamining])

  const roomConfig = tutorialConfig.room

  return (
    <div className="fixed inset-0 bg-[#0a0806]">
      <RoomView
        chapterId="tutorial"
        roomId={roomConfig.id}
        onHotspotClick={handleHotspotClick}
      />

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
        {collectToast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-[60] px-6 py-3 rounded-lg border border-amber-700/40 bg-amber-950/90 backdrop-blur-sm"
          >
            <p className="font-serif text-amber-200 text-sm tracking-wide">
              {collectToast}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <NotebookPanel
        isOpen={notebookOpen}
        onClose={() => setNotebookOpen(false)}
      />

      <TutorialOverlay
        steps={steps}
        currentStep={currentStep}
        onNext={handleNext}
        onSkip={handleSkip}
        onComplete={handleComplete}
      />
    </div>
  )
}
