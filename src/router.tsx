import { createBrowserRouter, Navigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import ProtectedRoute from '@/components/layout/ProtectedRoute';
import Login from '@/pages/login/Login';
import Dashboard from '@/pages/dashboard/Dashboard';
import ApplicationList from '@/pages/application/ApplicationList';
import ApplicationNew from '@/pages/application/ApplicationNew';
import ApplicationDetail from '@/pages/application/ApplicationDetail';
import ScheduleCalendar from '@/pages/schedule/ScheduleCalendar';
import ScheduleConflicts from '@/pages/schedule/ScheduleConflicts';
import ComplianceDashboard from '@/pages/compliance/ComplianceDashboard';
import ConfigReagents from '@/pages/config/ConfigReagents';
import ConfigLabels from '@/pages/config/ConfigLabels';
import ConfigMaintenance from '@/pages/config/ConfigMaintenance';
import ConfigAudit from '@/pages/config/ConfigAudit';
import NotificationList from '@/pages/notifications/NotificationList';
import NotificationFailures from '@/pages/notifications/NotificationFailures';
import SampleTracking from '@/pages/tracking/SampleTracking';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/',
    element: <ProtectedRoute />,
    children: [
      {
        path: '',
        element: <Navigate to="/dashboard" replace />,
      },
      {
        element: <MainLayout />,
        children: [
          {
            path: 'dashboard',
            element: <Dashboard />,
          },
          {
            path: 'application',
            children: [
              {
                path: '',
                element: <ApplicationList />,
              },
              {
                path: 'new',
                element: <ApplicationNew />,
              },
              {
                path: ':id',
                element: <ApplicationDetail />,
              },
            ],
          },
          {
            path: 'schedule',
            children: [
              {
                path: '',
                element: <Navigate to="/schedule/calendar" replace />,
              },
              {
                path: 'calendar',
                element: <ScheduleCalendar />,
              },
              {
                path: 'conflicts',
                element: <ScheduleConflicts />,
              },
            ],
          },
          {
            path: 'compliance',
            element: <ComplianceDashboard />,
          },
          {
            path: 'config',
            element: <ProtectedRoute allowedRoles={['ADMIN']} />,
            children: [
              {
                path: '',
                element: <Navigate to="/config/reagents" replace />,
              },
              {
                path: 'reagents',
                element: <ConfigReagents />,
              },
              {
                path: 'labels',
                element: <ConfigLabels />,
              },
              {
                path: 'maintenance',
                element: <ConfigMaintenance />,
              },
              {
                path: 'audit',
                element: <ConfigAudit />,
              },
            ],
          },
          {
            path: 'notifications',
            children: [
              {
                path: '',
                element: <NotificationList />,
              },
              {
                path: 'failures',
                element: <ProtectedRoute allowedRoles={['ADMIN']} />,
                children: [
                  {
                    path: '',
                    element: <NotificationFailures />,
                  },
                ],
              },
            ],
          },
          {
            path: 'tracking',
            element: <SampleTracking />,
          },
        ],
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/dashboard" replace />,
  },
]);
