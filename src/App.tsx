import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import MainMenu from "@/pages/MainMenu";
import LevelSelect from "@/pages/LevelSelect";
import GamePage from "@/pages/GamePage";
import ResultPage from "@/pages/ResultPage";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainMenu />} />
        <Route path="/levels" element={<LevelSelect />} />
        <Route path="/game/:levelId" element={<GamePage />} />
        <Route path="/result/:levelId" element={<ResultPage />} />
      </Routes>
    </Router>
  );
}
