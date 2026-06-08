import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "@/pages/Home";
import Tutorial from "@/pages/Tutorial";
import LevelSelect from "@/pages/LevelSelect";
import Game from "@/pages/Game";
import Result from "@/pages/Result";
import Failed from "@/pages/Failed";
import Editor from "@/pages/Editor";
import Debug from "@/pages/Debug";
import Settings from "@/pages/Settings";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/tutorial" element={<Tutorial />} />
        <Route path="/levels" element={<LevelSelect />} />
        <Route path="/game/:levelId" element={<Game />} />
        <Route path="/result/:levelId" element={<Result />} />
        <Route path="/failed/:levelId" element={<Failed />} />
        <Route path="/editor" element={<Editor />} />
        <Route path="/debug" element={<Debug />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </Router>
  );
}
