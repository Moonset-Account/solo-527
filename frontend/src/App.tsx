import { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation, useParams } from 'react-router-dom';
import { useAppStore } from './store';
import LoginPage from './pages/LoginPage';
import MobileLayout from './components/MobileLayout';
import DesktopLayout from './components/DesktopLayout';
import MobileProgressPage from './pages/mobile/MobileProgressPage';

function AuthRoute({ children }: { children: React.ReactNode }) {
  const { token } = useAppStore();
  const location = useLocation();
  if (!token) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }
  return <>{children}</>;
}

export default function App() {
  const { initFromStorage, mobileView, user } = useAppStore();

  useEffect(() => {
    initFromStorage();
  }, []);

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/m/progress/:id" element={
        <AuthRoute><MobileProgressRoute type="progress" /></AuthRoute>
      } />
      <Route
        path="/m/*" element={
          <AuthRoute>
            <MobileRoutes />
          </AuthRoute>
        }
      />
      <Route
        path="/*" element={
          <AuthRoute>
            <DesktopRoutes />
          </AuthRoute>
        }
      />
    </Routes>
  );
}

function MobileRoutes() {
  return <MobileLayout />;
}

function DesktopRoutes() {
  return <DesktopLayout />;
}

function MobileProgressRoute({ type }: { type: string }) {
  const { id } = useParams();
  if (type === 'progress' && id) {
    return <MobileProgressPage contractId={id} />;
  }
  return <Navigate to="/m" replace />;
}
