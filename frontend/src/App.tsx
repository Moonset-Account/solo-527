import { useEffect, ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import MainLayout from './layouts/MainLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AlertList from './pages/AlertList';
import AlertDetail from './pages/AlertDetail';
import AlertCreate from './pages/AlertCreate';
import AssetList from './pages/AssetList';
import BatchTaskList from './pages/BatchTaskList';
import VulnerabilityList from './pages/VulnerabilityList';
import AuditLogList from './pages/AuditLogList';
import UserList from './pages/UserList';
import NotificationList from './pages/NotificationList';
import { useAuthStore } from './store';
import { UserRole } from './types';
import './App.css';

function PrivateRoute({ children, requireAdmin = false }: { children: ReactNode; requireAdmin?: boolean }) {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && user?.role !== UserRole.Admin) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

function App() {
  const { setAuth, isAuthenticated } = useAuthStore();

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (userStr && token && !isAuthenticated) {
      try {
        const user = JSON.parse(userStr);
        setAuth(user, token);
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
  }, []);

  return (
    <ConfigProvider locale={zhCN}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <PrivateRoute>
                <MainLayout />
              </PrivateRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="alerts" element={<AlertList />} />
            <Route path="alerts/create" element={<AlertCreate />} />
            <Route path="alerts/:id" element={<AlertDetail />} />
            <Route path="assets" element={<AssetList />} />
            <Route path="batch-tasks" element={<BatchTaskList />} />
            <Route path="vulnerabilities" element={<VulnerabilityList />} />
            <Route path="notifications" element={<NotificationList />} />
            <Route
              path="audit-logs"
              element={
                <PrivateRoute requireAdmin>
                  <AuditLogList />
                </PrivateRoute>
              }
            />
            <Route
              path="users"
              element={
                <PrivateRoute requireAdmin>
                  <UserList />
                </PrivateRoute>
              }
            />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </ConfigProvider>
  );
}

export default App;
