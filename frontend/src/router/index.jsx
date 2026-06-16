import React, { useEffect, useRef, createContext, useContext } from 'react';
import { Routes, Route, Navigate, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Result, Button } from 'antd';
import { useAppStore } from '../store/index.js';
import { ROLE, hasRole, getRole } from '../utils/auth.js';
import MainLayout from '../layouts/MainLayout.jsx';
import Login from '../pages/Login.jsx';
import Dashboard from '../pages/Dashboard.jsx';
import SupplierList from '../pages/suppliers/List.jsx';
import SupplierDetail from '../pages/suppliers/Detail.jsx';
import ProductList from '../pages/products/List.jsx';
import InventoryList from '../pages/inventory/List.jsx';
import InventoryBatches from '../pages/inventory/Batches.jsx';
import InventoryNearExpiry from '../pages/inventory/NearExpiry.jsx';
import PurchaseList from '../pages/purchase/List.jsx';
import PurchaseDetail from '../pages/purchase/Detail.jsx';
import PurchaseCreate from '../pages/purchase/Create.jsx';
import InboundList from '../pages/inbound/List.jsx';
import InboundDetail from '../pages/inbound/Detail.jsx';
import InboundScan from '../pages/inbound/Scan.jsx';
import OutboundList from '../pages/outbound/List.jsx';
import OutboundDetail from '../pages/outbound/Detail.jsx';
import OutboundScan from '../pages/outbound/Scan.jsx';
import ExceptionList from '../pages/exceptions/List.jsx';
import ExceptionDetail from '../pages/exceptions/Detail.jsx';
import BatchOpList from '../pages/batchOps/List.jsx';
import BatchOpConfirm from '../pages/batchOps/Confirm.jsx';
import StatisticsIndex from '../pages/statistics/Index.jsx';
import RestockList from '../pages/restock/List.jsx';
import AlertList from '../pages/alerts/List.jsx';
import UserList from '../pages/users/List.jsx';
import Profile from '../pages/Profile.jsx';

const NavigateContext = createContext(null);

const navigateRef = { current: null };

const SUPPLIER_ALLOWED_PATHS = [
  '/dashboard',
  '/suppliers',
  '/purchase-orders',
  '/inbound-orders',
  '/alerts',
  '/profile',
];

const isSupplierPathAllowed = (pathname) => {
  return SUPPLIER_ALLOWED_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + '/')
  );
};

function AuthGuard() {
  const location = useLocation();
  const user = useAppStore((s) => s.user);
  const isLoggedIn = !!user;
  const role = getRole();

  if (!isLoggedIn) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (role === ROLE.SUPPLIER) {
    const path = location.pathname;
    if (!isSupplierPathAllowed(path) && path !== '/') {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <Outlet />;
}

function LoginGuard() {
  const location = useLocation();
  const user = useAppStore((s) => s.user);
  const isLoggedIn = !!user;
  const from = location.state?.from?.pathname || '/dashboard';

  if (isLoggedIn) {
    return <Navigate to={from} replace />;
  }

  return <Login />;
}

function SuperAdminGuard() {
  if (!hasRole(ROLE.SUPER_ADMIN)) {
    return <Navigate to="/dashboard" replace />;
  }
  return <Outlet />;
}

function NotFound() {
  const navigate = useNavigate();
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f5f5f5' }}>
      <Result
        status="404"
        title="404"
        subTitle="抱歉，您访问的页面不存在。"
        extra={
          <Button type="primary" onClick={() => navigate('/dashboard')}>
            返回首页
          </Button>
        }
      />
    </div>
  );
}

function NavigateBridge() {
  const navigate = useNavigate();
  useEffect(() => {
    navigateRef.current = navigate;
  }, [navigate]);
  return null;
}

function RouterView() {
  return (
    <>
      <NavigateBridge />
      <Routes>
        <Route path="/login" element={<LoginGuard />} />
        <Route element={<AuthGuard />}>
          <Route element={<MainLayout />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/suppliers" element={<SupplierList />} />
            <Route path="/suppliers/:id" element={<SupplierDetail />} />
            <Route path="/products" element={<ProductList />} />
            <Route path="/inventory" element={<InventoryList />} />
            <Route path="/inventory/batches" element={<InventoryBatches />} />
            <Route path="/inventory/near-expiry" element={<InventoryNearExpiry />} />
            <Route path="/purchase-orders" element={<PurchaseList />} />
            <Route path="/purchase-orders/new" element={<PurchaseCreate />} />
            <Route path="/purchase-orders/:id/edit" element={<PurchaseCreate />} />
            <Route path="/purchase-orders/:id" element={<PurchaseDetail />} />
            <Route path="/inbound-orders" element={<InboundList />} />
            <Route path="/inbound-orders/:id" element={<InboundDetail />} />
            <Route path="/inbound/scan" element={<InboundScan />} />
            <Route path="/outbound-orders" element={<OutboundList />} />
            <Route path="/outbound-orders/:id" element={<OutboundDetail />} />
            <Route path="/outbound/scan" element={<OutboundScan />} />
            <Route path="/exceptions" element={<ExceptionList />} />
            <Route path="/exceptions/:id" element={<ExceptionDetail />} />
            <Route path="/batch-ops" element={<BatchOpList />} />
            <Route path="/batch-ops/confirm/:id" element={<BatchOpConfirm />} />
            <Route path="/statistics" element={<StatisticsIndex />} />
            <Route path="/restock" element={<RestockList />} />
            <Route path="/alerts" element={<AlertList />} />
            <Route element={<SuperAdminGuard />}>
              <Route path="/users" element={<UserList />} />
            </Route>
            <Route path="/profile" element={<Profile />} />
          </Route>
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

const router = {
  navigate: (path, options) => {
    if (navigateRef.current) {
      navigateRef.current(path, options);
    } else {
      const origin = typeof location !== 'undefined' ? location.origin : '';
      window.location.href = origin + path;
    }
  },
};

export { RouterView };
export default router;
