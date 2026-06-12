import { createBrowserRouter, Navigate } from 'react-router-dom'
import AuthGuard from './AuthGuard'
import Login from '@/pages/login'
import NotFound from '@/pages/404'
import PortalLayout from '@/layouts/PortalLayout'
import AdminLayout from '@/layouts/AdminLayout'
import Apply from '@/pages/portal/apply'
import MyApplications from '@/pages/portal/my-applications'
import ApplicationDetail from '@/pages/portal/application-detail'
import Dashboard from '@/pages/admin/dashboard'
import Approval from '@/pages/admin/approval'
import Approved from '@/pages/admin/approved'
import Rules from '@/pages/admin/rules'
import Config from '@/pages/admin/config'
import ChangeLogs from '@/pages/admin/change-logs'
import Timeout from '@/pages/admin/timeout'
import AuditLogs from '@/pages/admin/audit-logs'
import Users from '@/pages/admin/users'
import type { RoleCode } from '@/types'

const adminRoles: RoleCode[] = ['ADMIN', 'FINANCE_MANAGER', 'APPROVER']

const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />
  },
  {
    path: '/portal',
    element: (
      <AuthGuard>
        <PortalLayout />
      </AuthGuard>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/portal/apply" replace />
      },
      {
        path: 'apply',
        element: <Apply />
      },
      {
        path: 'my-applications',
        element: <MyApplications />
      },
      {
        path: 'application-detail/:id',
        element: <ApplicationDetail />
      }
    ]
  },
  {
    path: '/admin',
    element: (
      <AuthGuard requiredRoles={adminRoles}>
        <AdminLayout />
      </AuthGuard>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/admin/dashboard" replace />
      },
      {
        path: 'dashboard',
        element: <Dashboard />
      },
      {
        path: 'approval',
        element: <Approval />
      },
      {
        path: 'approved',
        element: <Approved />
      },
      {
        path: 'rules',
        element: <Rules />
      },
      {
        path: 'config',
        element: <Config />
      },
      {
        path: 'change-logs',
        element: <ChangeLogs />
      },
      {
        path: 'timeout',
        element: <Timeout />
      },
      {
        path: 'audit-logs',
        element: <AuditLogs />
      },
      {
        path: 'users',
        element: (
          <AuthGuard requiredRoles={['ADMIN']}>
            <Users />
          </AuthGuard>
        )
      }
    ]
  },
  {
    path: '/',
    element: <Navigate to="/login" replace />
  },
  {
    path: '*',
    element: <NotFound />
  }
])

export default router
