import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import MainMenu from "@/pages/MainMenu";
import LevelSelect from "@/pages/LevelSelect";
import Factory from "@/pages/Factory";
import Achievements from "@/pages/Achievements";
import Stats from "@/pages/Stats";
import Settings from "@/pages/Settings";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainMenu />} />
        <Route path="/level-select" element={<LevelSelect />} />
        <Route path="/factory/:levelId" element={<Factory />} />
        <Route path="/achievements" element={<Achievements />} />
        <Route path="/stats" element={<Stats />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </Router>
  );
}
