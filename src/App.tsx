import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import NavBar from "@/components/NavBar";
import Sidebar from "@/components/Sidebar";
import Dashboard from "@/pages/Dashboard";
import Report from "@/pages/Report";
import DataGovernance from "@/pages/DataGovernance";
import { useState } from "react";

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <Router>
      <div className="flex flex-col min-h-screen bg-[#0A1628]">
        <NavBar />
        <div className="flex flex-1 pt-14">
          <Sidebar
            isOpen={sidebarOpen}
            onToggle={() => setSidebarOpen(!sidebarOpen)}
          />
          <main
            className="flex-1 transition-all duration-300 overflow-auto"
            style={{ marginLeft: sidebarOpen ? 280 : 60 }}
          >
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/report" element={<Report />} />
              <Route path="/data-governance" element={<DataGovernance />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
}
