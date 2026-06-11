import { createRootRoute, createRoute, createRouter, Outlet, Link, Navigate, redirect } from '@tanstack/react-router';
import Layout from '@/components/layout/MainLayout';
import LoginPage from '@/pages/LoginPage';
import HomePage from '@/pages/HomePage';
import ConcertListPage from '@/pages/ConcertListPage';
import ConcertDetailPage from '@/pages/ConcertDetailPage';
import SeatSelectionPage from '@/pages/SeatSelectionPage';
import MyOrdersPage from '@/pages/MyOrdersPage';
import OrderDetailPage from '@/pages/OrderDetailPage';
import ProfilePage from '@/pages/ProfilePage';
import AdminDashboard from '@/pages/admin/AdminDashboard';
import AdminOrders from '@/pages/admin/AdminOrders';
import AdminVerifications from '@/pages/admin/AdminVerifications';
import AdminRefunds from '@/pages/admin/AdminRefunds';
import AdminShows from '@/pages/admin/AdminShows';
import AdminTickets from '@/pages/admin/AdminTickets';
import AdminNotifications from '@/pages/admin/AdminNotifications';
import AdminAttendance from '@/pages/admin/AdminAttendance';
import { useAuthStore } from '@/store/auth';

export const rootRoute = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  return <Outlet />;
}

const layoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'layout',
  beforeLoad: () => {
    const token = localStorage.getItem('token');
    if (!token) {
      throw redirect({ to: '/login' });
    }
  },
  component: Layout,
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  beforeLoad: () => {
    const token = localStorage.getItem('token');
    if (token) {
      throw redirect({ to: '/' });
    }
  },
  component: LoginPage,
});

const indexRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/',
  component: HomePage,
});

const concertsRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/concerts',
  component: ConcertListPage,
});

const concertDetailRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/concerts/$id',
  component: ConcertDetailPage,
});

const seatSelectionRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/shows/$showId/select-seats',
  component: SeatSelectionPage,
});

const myOrdersRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/my-orders',
  component: MyOrdersPage,
});

const orderDetailRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/orders/$id',
  component: OrderDetailPage,
});

const profileRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/profile',
  component: ProfilePage,
});

const adminLayoutRoute = createRoute({
  getParentRoute: () => layoutRoute,
  id: 'admin',
  beforeLoad: () => {
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    if (!user || (user.role !== 'admin' && user.role !== 'box_office')) {
      throw redirect({ to: '/' });
    }
  },
  component: () => <Outlet />,
});

const adminDashboardRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: '/admin',
  component: AdminDashboard,
});

const adminOrdersRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: '/admin/orders',
  component: AdminOrders,
});

const adminVerificationsRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: '/admin/verifications',
  component: AdminVerifications,
});

const adminRefundsRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: '/admin/refunds',
  component: AdminRefunds,
});

const adminShowsRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: '/admin/shows',
  component: AdminShows,
});

const adminTicketsRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: '/admin/tickets',
  component: AdminTickets,
});

const adminNotificationsRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: '/admin/notifications',
  component: AdminNotifications,
});

const adminAttendanceRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: '/admin/attendance',
  component: AdminAttendance,
});

const routeTree = rootRoute.addChildren([
  loginRoute,
  layoutRoute.addChildren([
    indexRoute,
    concertsRoute,
    concertDetailRoute,
    seatSelectionRoute,
    myOrdersRoute,
    orderDetailRoute,
    profileRoute,
    adminLayoutRoute.addChildren([
      adminDashboardRoute,
      adminOrdersRoute,
      adminVerificationsRoute,
      adminRefundsRoute,
      adminShowsRoute,
      adminTicketsRoute,
      adminNotificationsRoute,
      adminAttendanceRoute,
    ]),
  ]),
]);

export { routeTree };
