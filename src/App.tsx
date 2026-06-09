import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, Outlet } from 'react-router-dom';
import Layout from '@/components/Layout';
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import Meetings from '@/pages/Meetings';
import MeetingDetail from '@/pages/MeetingDetail';
import Workbench from '@/pages/Workbench';
import Milestones from '@/pages/Milestones';
import Evaluation from '@/pages/Evaluation';
import Training from '@/pages/Training';
import UsersPage from '@/pages/admin/UsersPage';
import MaskingPage from '@/pages/admin/MaskingPage';
import MonitorPage from '@/pages/admin/MonitorPage';
import useAuthStore from '@/store/authStore';
import type { User, Role } from '#shared/types';

function ProtectedRoute({ allowedRoles }: { allowedRoles?: Role[] }) {
  const { isAuthenticated, hasRole } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated()) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !hasRole(allowedRoles)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/meetings" element={<Meetings />} />
            <Route path="/meetings/:id" element={<MeetingDetail />} />
            <Route path="/workbench" element={<Workbench />} />
            <Route path="/milestones" element={<Milestones />} />
            <Route path="/evaluation" element={<Evaluation />} />
            <Route path="/training" element={<Training />} />

            <Route element={<ProtectedRoute allowedRoles={['admin', 'reviewer']} />}>
              <Route path="/admin/users" element={<UsersPage />} />
            </Route>
            <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
              <Route path="/admin/masking" element={<MaskingPage />} />
              <Route path="/admin/monitor" element={<MonitorPage />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
}
