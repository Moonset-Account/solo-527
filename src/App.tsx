import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MainLayout } from './components/MainLayout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { WorkloadPage } from './pages/WorkloadPage';
import { ComparePage } from './pages/ComparePage';
import { RecoveryPage } from './pages/RecoveryPage';
import { InjuryPage } from './pages/InjuryPage';
import { ReportsPage } from './pages/ReportsPage';
import { useAuthStore } from './store';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function ProtectedRoute({ children, requireCoach = false }: { children: React.ReactNode; requireCoach?: boolean }) {
  const user = useAuthStore((s) => s.user);
  const isCoach = useAuthStore((s) => s.isCoach());

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requireCoach && !isCoach) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="workload" element={<WorkloadPage />} />
            <Route path="compare" element={<ComparePage />} />
            <Route path="recovery" element={<RecoveryPage />} />
            <Route
              path="injury"
              element={
                <ProtectedRoute requireCoach>
                  <InjuryPage />
                </ProtectedRoute>
              }
            />
            <Route path="reports" element={<ReportsPage />} />
          </Route>
        </Routes>
      </Router>
    </QueryClientProvider>
  );
}
