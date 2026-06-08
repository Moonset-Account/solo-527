import { useState, useEffect, useCallback } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import MainMenu from '@/pages/MainMenu'
import TutorialPage from '@/components/tutorial/TutorialPage'
import GamePage from '@/pages/GamePage'
import SettlementPageWrapper from '@/pages/SettlementPageWrapper'
import DebugPanel from '@/components/debug/DebugPanel'
import soundManager from '@/systems/SoundManager'
import soundsData from '@/config/sounds.json'
import type { SoundConfig } from '@/types'

const sounds = soundsData as SoundConfig[]

export default function App() {
  const [debugOpen, setDebugOpen] = useState(false)

  useEffect(() => {
    soundManager.registerSounds(sounds)
  }, [])

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === '`' || e.key === '~') {
      e.preventDefault()
      setDebugOpen((prev) => !prev)
    }
  }, [])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainMenu />} />
        <Route path="/tutorial" element={<TutorialPage />} />
        <Route path="/game/:chapterId/:roomId" element={<GamePage />} />
        <Route path="/settlement/:chapterId" element={<SettlementPageWrapper />} />
      </Routes>

      <DebugPanel
        isOpen={debugOpen}
        onClose={() => setDebugOpen(false)}
      />
    </BrowserRouter>
  )
}
