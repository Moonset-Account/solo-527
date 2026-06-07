import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import EventDetail from './pages/EventDetail';
import EventNew from './pages/EventNew';
import MapPage from './pages/MapPage';
import ReportsPage from './pages/ReportsPage';
import PublicReport from './pages/PublicReport';
import type { ReactNode } from 'react';

const ProtectedRoute = ({ children, requireRole }: { children: ReactNode; requireRole?: 'project_manager' | 'teacher' }) => {
  const { isAuthenticated, isProjectManager, isTeacher } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requireRole === 'project_manager' && !isProjectManager) {
    return <Navigate to="/dashboard" replace />;
  }

  if (requireRole === 'teacher' && !isTeacher) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/public" element={<PublicReport />} />
      
      <Route path="/" element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="event/:id" element={<EventDetail />} />
        <Route path="event/new" element={
          <ProtectedRoute requireRole="teacher">
            <EventNew />
          </ProtectedRoute>
        } />
        <Route path="map" element={
          <ProtectedRoute requireRole="project_manager">
            <MapPage />
          </ProtectedRoute>
        } />
        <Route path="reports" element={
          <ProtectedRoute requireRole="project_manager">
            <ReportsPage />
          </ProtectedRoute>
        } />
      </Route>
      
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
