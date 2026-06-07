import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import Dashboard from "@/pages/Dashboard";
import HazardList from "@/pages/HazardList";
import FineStatistics from "@/pages/FineStatistics";
import AppealList from "@/pages/AppealList";
import Settings from "@/pages/Settings";
import Login from "@/pages/Login";

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('auth-storage');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="hazards" element={<HazardList />} />
          <Route path="fines" element={<FineStatistics />} />
          <Route path="appeals" element={<AppealList />} />
          <Route path="settings" element={<Settings />} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
}
