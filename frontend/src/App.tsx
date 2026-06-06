import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import Dashboard from '@/pages/Dashboard';
import EnergyAnalysis from '@/pages/EnergyAnalysis';
import FaultMonitoring from '@/pages/FaultMonitoring';
import ReportCenter from '@/pages/ReportCenter';

const pageTitles: Record<string, string> = {
  '/': '总览看板',
  '/energy': '能耗分析',
  '/faults': '故障监控',
  '/reports': '报表中心',
};

function Layout() {
  const location = useLocation();
  const currentTitle = pageTitles[location.pathname] || '高校机房能耗与故障看板';
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleExportPDF = () => {
    const event = new CustomEvent('export-pdf');
    window.dispatchEvent(event);
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar title={currentTitle} onRefresh={handleRefresh} onExportPDF={handleExportPDF} />
        <Routes key={refreshKey}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/energy" element={<EnergyAnalysis />} />
          <Route path="/faults" element={<FaultMonitoring />} />
          <Route path="/reports" element={<ReportCenter />} />
        </Routes>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Layout />
    </Router>
  );
}
