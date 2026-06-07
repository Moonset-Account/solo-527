import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/layout/Sidebar';
import Dashboard from './pages/Dashboard';
import MapView from './pages/MapView';
import TrendAnalysis from './pages/TrendAnalysis';
import DataManagement from './pages/DataManagement';
import ExportCenter from './pages/ExportCenter';

export default function App() {
  return (
    <Router>
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/map" element={<MapView />} />
            <Route path="/trends" element={<TrendAnalysis />} />
            <Route path="/data-management" element={<DataManagement />} />
            <Route path="/export" element={<ExportCenter />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}
