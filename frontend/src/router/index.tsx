import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
  type RouteObject,
} from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { Layout } from '@/components/Layout/Layout';
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import TicketList from '@/pages/TicketList';
import TicketDetail from '@/pages/TicketDetail';
import TicketCreate from '@/pages/TicketCreate';
import KnowledgeSearch from '@/pages/KnowledgeSearch';
import KnowledgeDetail from '@/pages/KnowledgeDetail';
import Operations from '@/pages/Operations';
import Reports from '@/pages/Reports';
import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';

function ProtectedRoute({ children, requiredRoles }: { children: React.ReactNode; requiredRoles?: string[] }) {
  const { isAuthenticated, user, isLoading } = useAuthStore();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setChecking(false), 300);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading || checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <div className="flex items-center gap-3 text-zinc-500">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>加载中...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRoles && user && !requiredRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function RedirectToOperations() {
  return <Navigate to="/operations/service" replace />;
}

const routes: RouteObject[] = [
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Dashboard />,
      },
      {
        path: 'tickets',
        children: [
          {
            index: true,
            element: <TicketList />,
          },
          {
            path: 'create',
            element: <TicketCreate />,
          },
          {
            path: ':id',
            element: <TicketDetail />,
          },
        ],
      },
      {
        path: 'knowledge',
        children: [
          {
            index: true,
            element: <KnowledgeSearch />,
          },
          {
            path: ':id',
            element: <KnowledgeDetail />,
          },
        ],
      },
      {
        path: 'operations',
        children: [
          {
            index: true,
            element: <RedirectToOperations />,
          },
          {
            path: 'service',
            element: (
              <ProtectedRoute requiredRoles={['admin', 'agent']}>
                <Operations activeTab="service" />
              </ProtectedRoute>
            ),
          },
          {
            path: 'quality',
            element: (
              <ProtectedRoute requiredRoles={['admin', 'agent']}>
                <Operations activeTab="quality" />
              </ProtectedRoute>
            ),
          },
          {
            path: 'improvement',
            element: (
              <ProtectedRoute requiredRoles={['admin', 'agent']}>
                <Operations activeTab="improvement" />
              </ProtectedRoute>
            ),
          },
        ],
      },
      {
        path: 'reports',
        element: (
          <ProtectedRoute requiredRoles={['admin', 'agent']}>
            <Reports />
          </ProtectedRoute>
        ),
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
];

export const router = createBrowserRouter(routes);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
