import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import MainLayout from './components/Layout/MainLayout';
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuthStore } from './store/auth';

import StudentClasses from './pages/student/Classes';
import StudentSchedule from './pages/student/Schedule';
import StudentWorkFeedback from './pages/student/WorkFeedback';
import StudentNotifications from './pages/student/Notifications';
import StudentMonthlyReport from './pages/student/MonthlyReport';

import AdminDashboard from './pages/admin/Dashboard';
import AdminClasses from './pages/admin/Classes';
import AdminSchedules from './pages/admin/Schedules';
import AdminAttendance from './pages/admin/Attendance';
import AdminLeaves from './pages/admin/Leaves';
import AdminFeedbacks from './pages/admin/Feedbacks';
import AdminWarnings from './pages/admin/HoursWarnings';
import AdminReports from './pages/admin/Reports';
import AdminOperationLogs from './pages/admin/OperationLogs';
import AdminBatchOperations from './pages/admin/BatchOperations';

function App() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const fetchMe = useAuthStore((s) => s.fetchMe);

  useEffect(() => {
    if (isAuthenticated) {
      fetchMe();
    }
  }, [isAuthenticated, fetchMe]);

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />

        <Route path="dashboard" element={
          <ProtectedRoute roles={['Admin', 'Principal', 'Teacher', 'AdmissionAdvisor']}>
            <AdminDashboard />
          </ProtectedRoute>
        } />
        <Route path="classes" element={
          <ProtectedRoute roles={['Admin', 'Principal']}>
            <AdminClasses />
          </ProtectedRoute>
        } />
        <Route path="schedules" element={
          <ProtectedRoute roles={['Admin', 'Principal', 'Teacher']}>
            <AdminSchedules />
          </ProtectedRoute>
        } />
        <Route path="attendance" element={
          <ProtectedRoute roles={['Admin', 'Principal', 'Teacher']}>
            <AdminAttendance />
          </ProtectedRoute>
        } />
        <Route path="leaves" element={
          <ProtectedRoute roles={['Admin', 'Principal']}>
            <AdminLeaves />
          </ProtectedRoute>
        } />
        <Route path="feedbacks" element={
          <ProtectedRoute roles={['Admin', 'Principal', 'Teacher']}>
            <AdminFeedbacks />
          </ProtectedRoute>
        } />
        <Route path="warnings" element={
          <ProtectedRoute roles={['Admin', 'Principal', 'AdmissionAdvisor']}>
            <AdminWarnings />
          </ProtectedRoute>
        } />
        <Route path="reports" element={
          <ProtectedRoute roles={['Admin', 'Principal']}>
            <AdminReports />
          </ProtectedRoute>
        } />
        <Route path="logs" element={
          <ProtectedRoute roles={['Admin', 'Principal']}>
            <AdminOperationLogs />
          </ProtectedRoute>
        } />
        <Route path="batch" element={
          <ProtectedRoute roles={['Admin', 'Principal', 'Teacher']}>
            <AdminBatchOperations />
          </ProtectedRoute>
        } />

        <Route path="my/classes" element={
          <ProtectedRoute roles={['Student']}>
            <StudentClasses />
          </ProtectedRoute>
        } />
        <Route path="my/schedule" element={
          <ProtectedRoute roles={['Student']}>
            <StudentSchedule />
          </ProtectedRoute>
        } />
        <Route path="my/feedbacks" element={
          <ProtectedRoute roles={['Student']}>
            <StudentWorkFeedback />
          </ProtectedRoute>
        } />
        <Route path="my/notifications" element={
          <ProtectedRoute roles={['Student']}>
            <StudentNotifications />
          </ProtectedRoute>
        } />
        <Route path="my/report" element={
          <ProtectedRoute roles={['Student']}>
            <StudentMonthlyReport />
          </ProtectedRoute>
        } />
      </Route>
    </Routes>
  );
}

export default App;
