import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import MainMenu from '@/pages/MainMenu'
import Tutorial from '@/pages/Tutorial'
import LevelSelect from '@/pages/LevelSelect'
import GameScreen from '@/pages/GameScreen'
import ResultScreen from '@/pages/ResultScreen'
import Settings from '@/pages/Settings'

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainMenu />} />
        <Route path="/tutorial" element={<Tutorial />} />
        <Route path="/levels" element={<LevelSelect />} />
        <Route path="/game/:levelId" element={<GameScreen />} />
        <Route path="/result/:levelId" element={<ResultScreen />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </Router>
  )
}
