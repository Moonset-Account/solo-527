import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import useAuthStore from './store/authStore.js';
import Login from './pages/Login.jsx';
import MainLayout from './layouts/MainLayout.jsx';
import Dashboard from './pages/Dashboard.jsx';
import BillList from './pages/bills/BillList.jsx';
import BillDetail from './pages/bills/BillDetail.jsx';
import InvoiceList from './pages/invoices/InvoiceList.jsx';
import PaymentList from './pages/payments/PaymentList.jsx';
import PaymentEntry from './pages/payments/PaymentEntry.jsx';
import TransactionList from './pages/transactions/TransactionList.jsx';
import CollectionList from './pages/collections/CollectionList.jsx';
import RefundList from './pages/refunds/RefundList.jsx';
import WriteOffList from './pages/writeoffs/WriteOffList.jsx';
import Statistics from './pages/statistics/Statistics.jsx';
import CustomerList from './pages/customers/CustomerList.jsx';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, user } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/403" replace />;
  }

  return children;
};

const App = () => {
  const { init } = useAuthStore();

  useEffect(() => {
    init();
  }, [init]);

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        
        <Route path="bills" element={<BillList />} />
        <Route path="bills/:id" element={<BillDetail />} />
        
        <Route path="invoices" element={<InvoiceList />} />
        
        <Route path="payments" element={<PaymentList />} />
        <Route path="payment-entry" element={<PaymentEntry />} />
        
        <Route
          path="transactions"
          element={
            <ProtectedRoute allowedRoles={['FINANCE_STAFF', 'FINANCE_MANAGER', 'ADMIN']}>
              <TransactionList />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="collections"
          element={
            <ProtectedRoute allowedRoles={['FINANCE_STAFF', 'FINANCE_MANAGER', 'ADMIN']}>
              <CollectionList />
            </ProtectedRoute>
          }
        />
        
        <Route path="refunds" element={<RefundList />} />
        
        <Route
          path="writeoffs"
          element={
            <ProtectedRoute allowedRoles={['FINANCE_STAFF', 'FINANCE_MANAGER', 'ADMIN']}>
              <WriteOffList />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="statistics"
          element={
            <ProtectedRoute allowedRoles={['FINANCE_STAFF', 'FINANCE_MANAGER', 'ADMIN']}>
              <Statistics />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="customers"
          element={
            <ProtectedRoute allowedRoles={['FINANCE_STAFF', 'FINANCE_MANAGER', 'ADMIN']}>
              <CustomerList />
            </ProtectedRoute>
          }
        />
      </Route>
      
      <Route path="/403" element={
        <div style={{ textAlign: 'center', padding: '100px' }}>
          <h1>403</h1>
          <p>无权限访问该页面</p>
        </div>
      } />
      
      <Route path="*" element={
        <div style={{ textAlign: 'center', padding: '100px' }}>
          <h1>404</h1>
          <p>页面不存在</p>
        </div>
      } />
    </Routes>
  );
};

export default App;
