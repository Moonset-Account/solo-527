import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import CourseList from '@/pages/CourseList';
import CourseDetail from '@/pages/CourseDetail';
import SessionCalendar from '@/pages/SessionCalendar';
import SessionDetail from '@/pages/SessionDetail';
import GroupBooking from '@/pages/GroupBooking';
import IndividualBooking from '@/pages/IndividualBooking';
import MyBookings from '@/pages/MyBookings';
import ReviewList from '@/pages/ReviewList';
import ReviewDetail from '@/pages/ReviewDetail';
import Scheduling from '@/pages/Scheduling';
import MySchedule from '@/pages/MySchedule';
import Checkin from '@/pages/Checkin';
import TeachingAids from '@/pages/TeachingAids';
import FeedbackForm from '@/pages/FeedbackForm';
import FeedbackStats from '@/pages/FeedbackStats';
import Kanban from '@/pages/Kanban';
import Notifications from '@/pages/Notifications';
import AuditLogs from '@/pages/AuditLogs';
import AdminUsers from '@/pages/AdminUsers';

function AppRoutes() {
  const { loadFromStorage, isAuthenticated } = useAuthStore();

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />} />

      <Route element={<ProtectedRoute allowedRoles={['admin', 'manager', 'guide', 'school_contact', 'parent']}><Layout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/courses" element={<CourseList />} />
        <Route path="/courses/:id" element={<CourseDetail />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/feedback" element={<FeedbackForm />} />
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['manager', 'admin', 'guide']}><Layout /></ProtectedRoute>}>
        <Route path="/sessions" element={<SessionCalendar />} />
        <Route path="/sessions/:id" element={<SessionDetail />} />
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['school_contact']}><Layout /></ProtectedRoute>}>
        <Route path="/booking/group" element={<GroupBooking />} />
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['parent']}><Layout /></ProtectedRoute>}>
        <Route path="/booking/individual" element={<IndividualBooking />} />
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['school_contact', 'parent']}><Layout /></ProtectedRoute>}>
        <Route path="/my-bookings" element={<MyBookings />} />
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['manager', 'admin']}><Layout /></ProtectedRoute>}>
        <Route path="/review" element={<ReviewList />} />
        <Route path="/review/:id" element={<ReviewDetail />} />
        <Route path="/scheduling" element={<Scheduling />} />
        <Route path="/teaching-aids" element={<TeachingAids />} />
        <Route path="/feedback/stats" element={<FeedbackStats />} />
        <Route path="/kanban" element={<Kanban />} />
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['guide']}><Layout /></ProtectedRoute>}>
        <Route path="/my-schedule" element={<MySchedule />} />
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['manager', 'admin', 'guide']}><Layout /></ProtectedRoute>}>
        <Route path="/checkin" element={<Checkin />} />
        <Route path="/checkin/:sessionId" element={<Checkin />} />
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['admin']}><Layout /></ProtectedRoute>}>
        <Route path="/audit-logs" element={<AuditLogs />} />
        <Route path="/admin/users" element={<AdminUsers />} />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <Router>
      <AppRoutes />
    </Router>
  );
}
