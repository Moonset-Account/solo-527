import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuthStore } from '@/stores/authStore';
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import Members from '@/pages/Members';
import MemberDetail from '@/pages/MemberDetail';
import Coaches from '@/pages/Coaches';
import CoachDetail from '@/pages/CoachDetail';
import Packages from '@/pages/Packages';
import GroupClasses from '@/pages/GroupClasses';
import Appointments from '@/pages/Appointments';
import Freeze from '@/pages/Freeze';
import BodyTests from '@/pages/BodyTests';
import Messages from '@/pages/Messages';
import RenewalFunnel from '@/pages/RenewalFunnel';
import AuditLog from '@/pages/AuditLog';

function AuthInitializer({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, fetchMe } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      fetchMe();
    }
  }, []);

  return <>{children}</>;
}

export default function App() {
  return (
    <Router>
      <AuthInitializer>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/members" element={<ProtectedRoute roles={['admin', 'receptionist']}><Members /></ProtectedRoute>} />
            <Route path="/members/:id" element={<ProtectedRoute roles={['admin', 'receptionist']}><MemberDetail /></ProtectedRoute>} />
            <Route path="/coaches" element={<ProtectedRoute roles={['admin']}><Coaches /></ProtectedRoute>} />
            <Route path="/coaches/my-schedule" element={<ProtectedRoute roles={['coach']}><CoachDetail /></ProtectedRoute>} />
            <Route path="/coaches/my-performance" element={<ProtectedRoute roles={['coach']}><CoachDetail /></ProtectedRoute>} />
            <Route path="/coaches/:id" element={<ProtectedRoute roles={['admin']}><CoachDetail /></ProtectedRoute>} />
            <Route path="/packages" element={<ProtectedRoute roles={['admin', 'receptionist']}><Packages /></ProtectedRoute>} />
            <Route path="/group-classes" element={<ProtectedRoute roles={['admin', 'receptionist', 'coach']}><GroupClasses /></ProtectedRoute>} />
            <Route path="/appointments" element={<ProtectedRoute roles={['admin', 'receptionist', 'coach', 'member']}><Appointments /></ProtectedRoute>} />
            <Route path="/freeze" element={<ProtectedRoute roles={['admin', 'receptionist']}><Freeze /></ProtectedRoute>} />
            <Route path="/body-tests" element={<ProtectedRoute roles={['admin', 'coach', 'member']}><BodyTests /></ProtectedRoute>} />
            <Route path="/messages" element={<Messages />} />
            <Route path="/renewal-funnel" element={<ProtectedRoute roles={['admin', 'receptionist']}><RenewalFunnel /></ProtectedRoute>} />
            <Route path="/audit-log" element={<ProtectedRoute roles={['admin']}><AuditLog /></ProtectedRoute>} />
          </Route>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthInitializer>
    </Router>
  );
}
