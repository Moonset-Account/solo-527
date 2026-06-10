import { lazy, Suspense } from 'react';
import type { RouteObject } from 'react-router-dom';
import { Navigate } from 'react-router-dom';
import { Spin } from 'antd';
import MainLayout from '@/layouts/MainLayout';

const LazyWrapper = (Component: React.LazyExoticComponent<React.ComponentType<any>>) => (
  <Suspense fallback={<Spin size="large" style={{ display: 'flex', justifyContent: 'center', padding: 100 }} />}>
    <Component />
  </Suspense>
);

const Dashboard = lazy(() => import('@/pages/dashboard/Dashboard'));
const OrderList = lazy(() => import('@/pages/orders/OrderList'));
const OrderDetail = lazy(() => import('@/pages/orders/OrderDetail'));
const ProductionNodes = lazy(() => import('@/pages/production/ProductionNodes'));
const ProductionProgressList = lazy(() => import('@/pages/production/ProductionProgressList'));
const TeamList = lazy(() => import('@/pages/production/TeamList'));
const TeamScheduleList = lazy(() => import('@/pages/production/TeamScheduleList'));
const MaterialList = lazy(() => import('@/pages/materials/MaterialList'));
const MaterialCostList = lazy(() => import('@/pages/materials/MaterialCostList'));
const QualityInspections = lazy(() => import('@/pages/quality/QualityInspections'));
const MaterialShortages = lazy(() => import('@/pages/shortages/MaterialShortages'));
const CustomerList = lazy(() => import('@/pages/customers/CustomerList'));
const PriceListPage = lazy(() => import('@/pages/customers/PriceListPage'));
const SystemConfigs = lazy(() => import('@/pages/system/SystemConfigs'));
const ExportRecords = lazy(() => import('@/pages/exports/ExportRecords'));

const routes: RouteObject[] = [
  {
    path: '/',
    element: <MainLayout />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', element: LazyWrapper(Dashboard) },
      { path: 'orders', element: LazyWrapper(OrderList) },
      { path: 'orders/:id', element: LazyWrapper(OrderDetail) },
      { path: 'production/nodes', element: LazyWrapper(ProductionNodes) },
      { path: 'production/progress', element: LazyWrapper(ProductionProgressList) },
      { path: 'production/teams', element: LazyWrapper(TeamList) },
      { path: 'production/schedules', element: LazyWrapper(TeamScheduleList) },
      { path: 'materials/list', element: LazyWrapper(MaterialList) },
      { path: 'materials/costs', element: LazyWrapper(MaterialCostList) },
      { path: 'quality/inspections', element: LazyWrapper(QualityInspections) },
      { path: 'shortages', element: LazyWrapper(MaterialShortages) },
      { path: 'customers', element: LazyWrapper(CustomerList) },
      { path: 'customers/prices', element: LazyWrapper(PriceListPage) },
      { path: 'system/configs', element: LazyWrapper(SystemConfigs) },
      { path: 'exports/records', element: LazyWrapper(ExportRecords) },
    ],
  },
];

export default routes;
