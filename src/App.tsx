import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import Sidebar from './components/layout/Sidebar';
import Dashboard from './pages/Dashboard';
import MapView from './pages/MapView';
import TrendAnalysis from './pages/TrendAnalysis';
import DataManagement from './pages/DataManagement';
import ExportCenter from './pages/ExportCenter';
import Login from './pages/Login';
import { useAuthStore, initAuthFromStorage } from './store/useFilterStore';

function ProtectedRoute({ children, requireAdmin = false }: { children: React.ReactNode; requireAdmin?: boolean }) {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && user?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        {children}
      </div>
    </div>
  );
}

export default function App() {
  useEffect(() => {
    initAuthFromStorage();
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Dashboard />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/map"
          element={
            <ProtectedRoute>
              <AppLayout>
                <MapView />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/trends"
          element={
            <ProtectedRoute>
              <AppLayout>
                <TrendAnalysis />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/data-management"
          element={
            <ProtectedRoute requireAdmin>
              <AppLayout>
                <DataManagement />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/export"
          element={
            <ProtectedRoute>
              <AppLayout>
                <ExportCenter />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
