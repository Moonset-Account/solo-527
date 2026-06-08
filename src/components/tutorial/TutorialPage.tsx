import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import RoomView from '@/components/game/RoomView'
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

  const [steps] = useState<TutorialStep[]>(
    () => tutorialConfig.steps as TutorialStep[]
  )
  const [currentStep, setCurrentStep] = useState(0)

  const goToChapter1 = useCallback(() => {
    setChapter('chapter1')
    enterRoom('room_201')
    setPhase('playing')
    navigate('/chapter/chapter1')
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
    (hotspotId: string, _type: string, _targetId: string) => {
      if (currentStep < steps.length && steps[currentStep].highlightTarget === hotspotId) {
        handleNext()
      }
    },
    [currentStep, steps, handleNext],
  )

  const roomConfig = tutorialConfig.room

  return (
    <div className="fixed inset-0 bg-[#0a0806]">
      <RoomView
        chapterId="tutorial"
        roomId={roomConfig.id}
        onHotspotClick={handleHotspotClick}
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
