import { createRootRoute, createRoute, createRouter, redirect } from '@tanstack/react-router';
import { RootLayout } from './components/Layout/RootLayout';
import { LoginPage } from './pages/Login';
import { DashboardPage } from './pages/Dashboard';
import { DevicesPage } from './pages/Devices';
import { InspectionsPage } from './pages/Inspections';
import { RepairsPage } from './pages/Repairs';
import { SchedulesPage } from './pages/Schedules';
import { PricingPage } from './pages/Pricing';
import { WaitlistPage } from './pages/Waitlist';
import { EventsPage } from './pages/Events';
import { ReportsPage } from './pages/Reports';
import { LogsPage } from './pages/Logs';
import { useAuthStore } from './store/auth';

const rootRoute = createRootRoute({
  component: RootLayout,
  beforeLoad: async () => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        useAuthStore.setState({ token, user });
      } catch (e) {
        console.error(e);
      }
    }
  },
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: LoginPage,
  beforeLoad: () => {
    const token = localStorage.getItem('token');
    if (token) {
      throw redirect({ to: '/' });
    }
  },
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: DashboardPage,
  beforeLoad: () => {
    const token = localStorage.getItem('token');
    if (!token) {
      throw redirect({ to: '/login' });
    }
  },
});

const devicesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/devices',
  component: DevicesPage,
  beforeLoad: () => {
    const token = localStorage.getItem('token');
    if (!token) {
      throw redirect({ to: '/login' });
    }
  },
});

const inspectionsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/inspections',
  component: InspectionsPage,
  beforeLoad: () => {
    const token = localStorage.getItem('token');
    if (!token) {
      throw redirect({ to: '/login' });
    }
  },
});

const repairsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/repairs',
  component: RepairsPage,
  beforeLoad: () => {
    const token = localStorage.getItem('token');
    if (!token) {
      throw redirect({ to: '/login' });
    }
  },
});

const schedulesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/schedules',
  component: SchedulesPage,
  beforeLoad: () => {
    const token = localStorage.getItem('token');
    if (!token) {
      throw redirect({ to: '/login' });
    }
  },
});

const pricingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/pricing',
  component: PricingPage,
  beforeLoad: () => {
    const token = localStorage.getItem('token');
    if (!token) {
      throw redirect({ to: '/login' });
    }
  },
});

const waitlistRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/waitlist',
  component: WaitlistPage,
  beforeLoad: () => {
    const token = localStorage.getItem('token');
    if (!token) {
      throw redirect({ to: '/login' });
    }
  },
});

const eventsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/events',
  component: EventsPage,
  beforeLoad: () => {
    const token = localStorage.getItem('token');
    if (!token) {
      throw redirect({ to: '/login' });
    }
  },
});

const reportsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/reports',
  component: ReportsPage,
  beforeLoad: () => {
    const token = localStorage.getItem('token');
    if (!token) {
      throw redirect({ to: '/login' });
    }
  },
});

const logsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/logs',
  component: LogsPage,
  beforeLoad: () => {
    const token = localStorage.getItem('token');
    if (!token) {
      throw redirect({ to: '/login' });
    }
  },
});

const routeTree = rootRoute.addChildren([
  loginRoute,
  indexRoute,
  devicesRoute,
  inspectionsRoute,
  repairsRoute,
  schedulesRoute,
  pricingRoute,
  waitlistRoute,
  eventsRoute,
  reportsRoute,
  logsRoute,
]);

const router = createRouter({ routeTree });

export default router;
export { routeTree };
