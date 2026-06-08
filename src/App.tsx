import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainMenu from '@/pages/MainMenu';
import Tutorial from '@/pages/Tutorial';
import Lab from '@/pages/Lab';
import Knowledge from '@/pages/Knowledge';
import Result from '@/pages/Result';
import Settings from '@/pages/Settings';
import Records from '@/pages/Records';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainMenu />} />
        <Route path="/tutorial" element={<Tutorial />} />
        <Route path="/lab/:levelId" element={<Lab />} />
        <Route path="/knowledge/:cardId" element={<Knowledge />} />
        <Route path="/result/:levelId" element={<Result />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/records" element={<Records />} />
      </Routes>
    </Router>
  );
}
