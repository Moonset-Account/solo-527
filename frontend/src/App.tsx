import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/auth';
import MainLayout from './layouts/MainLayout';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import Materials from './pages/Materials';
import MaterialDetail from './pages/MaterialDetail';
import Orders from './pages/Orders';
import OrderDetail from './pages/OrderDetail';
import Settlements from './pages/Settlements';
import ExceptionList from './pages/ExceptionList';
import ExceptionDetail from './pages/ExceptionDetail';
import Statistics from './pages/Statistics';
import MaterialMarket from './pages/MaterialMarket';
import ClientOrderConfirm from './pages/ClientOrderConfirm';
import ClientDownload from './pages/ClientDownload';
import Users from './pages/Users';

function App() {
  const restore = useAuthStore((s) => s.restore);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    restore();
  }, [restore]);

  return (
    <Routes>
      <Route path="/login" element={!isAuthenticated ? <LoginPage /> : <Navigate to="/" />} />

      <Route
        path="/market"
        element={
          isAuthenticated ? (
            <MainLayout>
              <MaterialMarket />
            </MainLayout>
          ) : (
            <Navigate to="/login" />
          )
        }
      />

      <Route
        path="/orders/:id/confirm"
        element={
          isAuthenticated ? (
            <MainLayout>
              <ClientOrderConfirm />
            </MainLayout>
          ) : (
            <Navigate to="/login" />
          )
        }
      />

      <Route
        path="/orders/:id/download"
        element={
          isAuthenticated ? (
            <MainLayout>
              <ClientDownload />
            </MainLayout>
          ) : (
            <Navigate to="/login" />
          )
        }
      />

      <Route
        path="/"
        element={
          isAuthenticated ? (
            <MainLayout>
              <Dashboard />
            </MainLayout>
          ) : (
            <Navigate to="/login" />
          )
        }
      />

      <Route
        path="/materials"
        element={
          isAuthenticated ? (
            <MainLayout>
              <Materials />
            </MainLayout>
          ) : (
            <Navigate to="/login" />
          )
        }
      />

      <Route
        path="/materials/:id"
        element={
          isAuthenticated ? (
            <MainLayout>
              <MaterialDetail />
            </MainLayout>
          ) : (
            <Navigate to="/login" />
          )
        }
      />

      <Route
        path="/orders"
        element={
          isAuthenticated ? (
            <MainLayout>
              <Orders />
            </MainLayout>
          ) : (
            <Navigate to="/login" />
          )
        }
      />

      <Route
        path="/orders/:id"
        element={
          isAuthenticated ? (
            <MainLayout>
              <OrderDetail />
            </MainLayout>
          ) : (
            <Navigate to="/login" />
          )
        }
      />

      <Route
        path="/settlements"
        element={
          isAuthenticated ? (
            <MainLayout>
              <Settlements />
            </MainLayout>
          ) : (
            <Navigate to="/login" />
          )
        }
      />

      <Route
        path="/exceptions"
        element={
          isAuthenticated ? (
            <MainLayout>
              <ExceptionList />
            </MainLayout>
          ) : (
            <Navigate to="/login" />
          )
        }
      />

      <Route
        path="/exceptions/:id"
        element={
          isAuthenticated ? (
            <MainLayout>
              <ExceptionDetail />
            </MainLayout>
          ) : (
            <Navigate to="/login" />
          )
        }
      />

      <Route
        path="/statistics"
        element={
          isAuthenticated ? (
            <MainLayout>
              <Statistics />
            </MainLayout>
          ) : (
            <Navigate to="/login" />
          )
        }
      />

      <Route
        path="/users"
        element={
          isAuthenticated && user?.role === 'admin' ? (
            <MainLayout>
              <Users />
            </MainLayout>
          ) : (
            <Navigate to="/login" />
          )
        }
      />

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;
