import { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CampList from './pages/camps/CampList';
import CampDetail from './pages/camps/CampDetail';
import CheckInDesk from './pages/checkin/CheckInDesk';
import MemberList from './pages/members/MemberList';
import MemberDetail from './pages/members/MemberDetail';
import TodoCenter from './pages/todos/TodoCenter';
import LaggingStudents from './pages/lagging/LaggingStudents';
import ConversionStats from './pages/conversion/ConversionStats';
import RetentionReport from './pages/reports/RetentionReport';
import Handover from './pages/handover/Handover';
import OperationLogs from './pages/logs/OperationLogs';
import UserManagement from './pages/users/UserManagement';
import ProtectedRoute from './components/ProtectedRoute';
import { useAppStore, useAuthStore } from './store';

export default function App() {
  const location = useLocation();
  const setCurrentPath = useAppStore((s) => s.setCurrentPath);
  const initFromStorage = useAuthStore((s) => s.initFromStorage);

  useEffect(() => {
    initFromStorage();
  }, [initFromStorage]);

  useEffect(() => {
    setCurrentPath(location.pathname);
  }, [location.pathname, setCurrentPath]);

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
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="camps" element={<CampList />} />
        <Route path="camps/:id" element={<CampDetail />} />
        <Route path="checkin" element={<CheckInDesk />} />
        <Route path="members" element={<MemberList />} />
        <Route path="members/:id" element={<MemberDetail />} />
        <Route path="todos" element={<TodoCenter />} />
        <Route path="lagging" element={<LaggingStudents />} />
        <Route path="conversion" element={<ConversionStats />} />
        <Route path="retention" element={<RetentionReport />} />
        <Route path="handover" element={<Handover />} />
        <Route path="logs" element={<OperationLogs />} />
        <Route path="users" element={<UserManagement />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
