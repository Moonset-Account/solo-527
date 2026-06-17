import { createRootRoute, Outlet } from '@tanstack/react-router';
import { useEffect } from 'react';
import AppLayout from '../components/AppLayout';
import Toast from '../components/Toast';
import { useApp } from '../store/app';
import { endpoints } from '../lib/api';

export const Route = createRootRoute({
  component: () => {
    const setCurrentUser = useApp((s) => s.setCurrentUser);
    const setAlertUnread = useApp((s) => s.setAlertUnread);

    useEffect(() => {
      endpoints.me().then(setCurrentUser).catch(() => {});
      endpoints.alertSummary().then((s) => {
        setAlertUnread((s?.statuses?.pending || 0) + (s?.statuses?.processing || 0));
      }).catch(() => {});
      const timer = setInterval(() => {
        endpoints.alertSummary().then((s) => {
          setAlertUnread((s?.statuses?.pending || 0) + (s?.statuses?.processing || 0));
        }).catch(() => {});
      }, 60000);
      return () => clearInterval(timer);
    }, []);

    return (
      <AppLayout>
        <Outlet />
        <Toast />
      </AppLayout>
    );
  },
});
