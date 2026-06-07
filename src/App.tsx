import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useAppStore } from "@/store";
import Sidebar from "@/components/Sidebar";
import FilterBar from "@/components/FilterBar";
import Dashboard from "@/pages/Dashboard";
import Channels from "@/pages/Channels";
import Workload from "@/pages/Workload";
import Report from "@/pages/Report";

function Layout({ children }: { children: React.ReactNode }) {
  const { sidebarOpen } = useAppStore();

  return (
    <div className="min-h-screen bg-primary-dark font-sans">
      <FilterBar />
      <Sidebar />
      <main
        className={`pt-14 transition-all duration-300 ${
          sidebarOpen ? "ml-56" : "ml-0"
        }`}
      >
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/channels" element={<Channels />} />
          <Route path="/workload" element={<Workload />} />
          <Route path="/report" element={<Report />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Layout>
    </Router>
  );
}
