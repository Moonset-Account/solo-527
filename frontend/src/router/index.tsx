import { Navigate, type RouteObject } from 'react-router-dom'
import MainLayout from '@/layouts/MainLayout'
import LoginLayout from '@/layouts/LoginLayout'
import Login from '@/pages/login'
import NotFound from '@/pages/404'
import WorkerDashboard from '@/pages/worker/dashboard'
import EventReport from '@/pages/worker/event-report'
import WorkerEventList from '@/pages/worker/event-list'
import TodoList from '@/pages/worker/todo-list'
import ResidentList from '@/pages/admin/resident-list'
import ResidentImport from '@/pages/admin/resident-import'
import ManagerDashboard from '@/pages/manager/dashboard'
import EventDetail from '@/pages/manager/event-detail'
import PatrolTasks from '@/pages/manager/patrol-tasks'
import Reports from '@/pages/manager/reports'
import { getToken, hasRole, getUserInfo } from '@/utils/auth'
import type { UserRole } from '@/types'

const RequireAuth = ({ children }: { children: JSX.Element }) => {
  const token = getToken()
  if (!token) {
    return <Navigate to="/login" replace />
  }
  return children
}

const RequireRole = ({
  children,
  roles
}: {
  children: JSX.Element
  roles: UserRole[]
}) => {
  if (!hasRole(roles)) {
    return <Navigate to="/403" replace />
  }
  return children
}

const getHomeRoute = (): string => {
  const user = getUserInfo()
  if (!user) return '/login'
  if (user.roles.includes('worker')) return '/worker/dashboard'
  if (user.roles.includes('admin')) return '/admin/resident-list'
  if (user.roles.includes('manager')) return '/manager/dashboard'
  return '/login'
}

const IndexRedirect = () => <Navigate to={getHomeRoute()} replace />

const routes: RouteObject[] = [
  {
    path: '/',
    element: (
      <RequireAuth>
        <MainLayout />
      </RequireAuth>
    ),
    children: [
      {
        index: true,
        element: <IndexRedirect />
      },
      {
        path: 'worker',
        children: [
          {
            path: 'dashboard',
            element: (
              <RequireRole roles={['worker', 'manager']}>
                <WorkerDashboard />
              </RequireRole>
            )
          },
          {
            path: 'event-report',
            element: (
              <RequireRole roles={['worker']}>
                <EventReport />
              </RequireRole>
            )
          },
          {
            path: 'event-list',
            element: (
              <RequireRole roles={['worker', 'manager']}>
                <WorkerEventList />
              </RequireRole>
            )
          },
          {
            path: 'todo-list',
            element: (
              <RequireRole roles={['worker', 'manager']}>
                <TodoList />
              </RequireRole>
            )
          }
        ]
      },
      {
        path: 'admin',
        children: [
          {
            path: 'resident-list',
            element: (
              <RequireRole roles={['admin', 'manager']}>
                <ResidentList />
              </RequireRole>
            )
          },
          {
            path: 'resident-import',
            element: (
              <RequireRole roles={['admin', 'manager']}>
                <ResidentImport />
              </RequireRole>
            )
          }
        ]
      },
      {
        path: 'manager',
        children: [
          {
            path: 'dashboard',
            element: (
              <RequireRole roles={['manager']}>
                <ManagerDashboard />
              </RequireRole>
            )
          },
          {
            path: 'event-detail/:id',
            element: (
              <RequireRole roles={['manager']}>
                <EventDetail />
              </RequireRole>
            )
          },
          {
            path: 'patrol-tasks',
            element: (
              <RequireRole roles={['manager']}>
                <PatrolTasks />
              </RequireRole>
            )
          },
          {
            path: 'reports',
            element: (
              <RequireRole roles={['manager']}>
                <Reports />
              </RequireRole>
            )
          }
        ]
      }
    ]
  },
  {
    path: '/login',
    element: <LoginLayout />,
    children: [
      {
        index: true,
        element: <Login />
      }
    ]
  },
  {
    path: '/403',
    element: (
      <div style={{ padding: 100, textAlign: 'center' }}>
        <h1>403</h1>
        <p>您没有权限访问此页面</p>
      </div>
    )
  },
  {
    path: '*',
    element: <NotFound />
  }
]

export default routes
