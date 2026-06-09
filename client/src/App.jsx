import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import Layout from './components/Layout';

import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ContractsPage from './pages/ContractsPage';
import ContractDetailPage from './pages/ContractDetailPage';
import ReviewQueuePage from './pages/ReviewQueuePage';
import AlertsPage from './pages/AlertsPage';
import AuditPage from './pages/AuditPage';
import { ClauseListsPage, ClauseListDetailPage } from './pages/ClauseListsPage';

const RequireAuth = ({ children, roles }) => {
  const { user, loading, hasRole } = useAuth();

  if (loading) {
    return (
      <div className="card" style={{ maxWidth: 400, margin: '100px auto', textAlign: 'center' }}>
        <div className="empty-icon" style={{ fontSize: 48 }}>⏳</div>
        <div className="empty-text">加载中...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (roles && roles.length > 0 && !hasRole(...roles)) {
    return (
      <div className="card" style={{ maxWidth: 500, margin: '100px auto', textAlign: 'center' }}>
        <div className="empty-icon" style={{ fontSize: 48 }}>🚫</div>
        <div className="empty-text">权限不足</div>
        <div className="empty-hint">您的角色无权限访问此页面</div>
      </div>
    );
  }

  return children;
};

const AppRoutes = () => {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <LoginPage />} />

      <Route
        path="/"
        element={
          <RequireAuth>
            <Layout />
          </RequireAuth>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="contracts" element={<ContractsPage />} />
        <Route
          path="contract/:id"
          element={
            <RequireAuth>
              <ContractDetailPage />
            </RequireAuth>
          }
        />
        <Route
          path="review-queue"
          element={
            <RequireAuth roles={['admin', 'reviewer']}>
              <ReviewQueuePage />
            </RequireAuth>
          }
        />
        <Route
          path="clause-lists"
          element={
            <RequireAuth roles={['admin', 'reviewer']}>
              <ClauseListsPage />
            </RequireAuth>
          }
        />
        <Route
          path="clause-lists/:id"
          element={
            <RequireAuth roles={['admin', 'reviewer']}>
              <ClauseListDetailPage />
            </RequireAuth>
          }
        />
        <Route
          path="alerts"
          element={
            <RequireAuth roles={['admin', 'reviewer']}>
              <AlertsPage />
            </RequireAuth>
          }
        />
        <Route
          path="audit"
          element={
            <RequireAuth roles={['admin', 'reviewer']}>
              <AuditPage />
            </RequireAuth>
          }
        />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>

      <Route path="*" element={<Navigate to={user ? "/dashboard" : "/login"} replace />} />
    </Routes>
  );
};

const App = () => {
  return (
    <ToastProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </ToastProvider>
  );
};

export default App;
