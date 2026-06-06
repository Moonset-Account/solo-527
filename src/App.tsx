import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { FilterPanel } from './components/filters/FilterPanel';
import { useDashboardStore } from './store/useDashboardStore';
import { useEffect } from 'react';
import Home from './pages/Home';
import Reservation from './pages/Reservation';
import Overdue from './pages/Overdue';
import Readers from './pages/Readers';
import DataQuality from './pages/DataQuality';

function AppLayout() {
  const { sidebarOpen, loadFilterOptions, loadSavedFilters, loadDataQualityStatus } = useDashboardStore();

  useEffect(() => {
    loadFilterOptions();
    loadSavedFilters();
    loadDataQualityStatus();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <div
        className={`transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-16'}`}
      >
        <Header />
        <div className="flex">
          <FilterPanel />
          <main className="flex-1 p-6 overflow-auto">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/reservation" element={<Reservation />} />
              <Route path="/overdue" element={<Overdue />} />
              <Route path="/readers" element={<Readers />} />
              <Route path="/data-quality" element={<DataQuality />} />
            </Routes>
          </main>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AppLayout />
    </Router>
  );
}
