import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from '@/stores/auth';
import Layout from '@/components/Layout';
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import ReconciliationList from '@/pages/ReconciliationList';
import ReconciliationUpload from '@/pages/ReconciliationUpload';
import ReconciliationDetail from '@/pages/ReconciliationDetail';
import ReminderList from '@/pages/ReminderList';
import ReminderConfig from '@/pages/ReminderConfig';
import ConfigCenter from '@/pages/ConfigCenter';
import ConfigChangelog from '@/pages/ConfigChangelog';
import Reports from '@/pages/Reports';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<Dashboard />} />
          <Route path="/reconciliation" element={<ReconciliationList />} />
          <Route path="/reconciliation/upload" element={<ReconciliationUpload />} />
          <Route path="/reconciliation/:id" element={<ReconciliationDetail />} />
          <Route path="/reminders" element={<ReminderList />} />
          <Route path="/reminders/config" element={<ReminderConfig />} />
          <Route path="/config" element={<ConfigCenter />} />
          <Route path="/config/changelog" element={<ConfigChangelog />} />
          <Route path="/reports" element={<Reports />} />
        </Route>
      </Routes>
    </Router>
  );
}
