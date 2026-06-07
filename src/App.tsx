import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/layout/Sidebar';
import FilterBar from './components/layout/FilterBar';
import Dashboard from './pages/Dashboard';
import EfficiencyPage from './pages/EfficiencyPage';
import ChannelPage from './pages/ChannelPage';
import InterviewerPage from './pages/InterviewerPage';
import FeedbackPage from './pages/FeedbackPage';
import RecordsPage from './pages/RecordsPage';
import DataManagerPage from './pages/DataManagerPage';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-slate-50">
        <Sidebar />
        <div className="ml-60">
          <FilterBar />
          <main className="p-6">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/efficiency" element={<EfficiencyPage />} />
              <Route path="/channel" element={<ChannelPage />} />
              <Route path="/interviewer" element={<InterviewerPage />} />
              <Route path="/feedback" element={<FeedbackPage />} />
              <Route path="/records" element={<RecordsPage />} />
              <Route path="/data" element={<DataManagerPage />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
}

export default App;
