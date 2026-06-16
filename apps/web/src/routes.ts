import { createRootRoute, Outlet, createRoute } from '@tanstack/react-router';
import RootLayout from '../components/layout/RootLayout';
import DashboardPage from '../pages/DashboardPage';
import CampsPage from '../pages/CampsPage';
import CampDetailPage from '../pages/CampDetailPage';
import ChaptersPage from '../pages/ChaptersPage';
import MembersPage from '../pages/MembersPage';
import MemberDetailPage from '../pages/MemberDetailPage';
import CheckinsPage from '../pages/CheckinsPage';
import RefundsPage from '../pages/RefundsPage';
import BenefitsPage from '../pages/BenefitsPage';
import TodosPage from '../pages/TodosPage';
import StatsPage from '../pages/StatsPage';
import ExportPage from '../pages/ExportPage';

export const rootRoute = createRootRoute({
  component: () => (
    <RootLayout>
      <Outlet />
    </RootLayout>
  ),
});

export const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: DashboardPage,
});

export const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/dashboard',
  component: DashboardPage,
});

export const campsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/camps',
  component: CampsPage,
});

export const campDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/camps/$campId',
  component: CampDetailPage,
});

export const chaptersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/chapters',
  component: ChaptersPage,
});

export const membersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/members',
  component: MembersPage,
});

export const memberDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/members/$memberId',
  component: MemberDetailPage,
});

export const checkinsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/checkins',
  component: CheckinsPage,
});

export const refundsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/refunds',
  component: RefundsPage,
});

export const benefitsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/benefits',
  component: BenefitsPage,
});

export const todosRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/todos',
  component: TodosPage,
});

export const statsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/stats',
  component: StatsPage,
});

export const exportRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/export',
  component: ExportPage,
});

export const routeTree = rootRoute.addChildren([
  indexRoute,
  dashboardRoute,
  campsRoute,
  campDetailRoute,
  chaptersRoute,
  membersRoute,
  memberDetailRoute,
  checkinsRoute,
  refundsRoute,
  benefitsRoute,
  todosRoute,
  statsRoute,
  exportRoute,
]);
