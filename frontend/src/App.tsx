import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import EquipmentList from './pages/EquipmentList';
import EquipmentDetail from './pages/EquipmentDetail';
import Fields from './pages/Fields';
import Reservations from './pages/Reservations';
import NewReservation from './pages/NewReservation';
import Work from './pages/Work';
import Maintenance from './pages/Maintenance';
import Settlement from './pages/Settlement';
import AuditLogs from './pages/AuditLogs';

function App() {
  const { isAuthenticated, fetchCurrentUser, token } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated && token) {
      fetchCurrentUser();
    }
  }, [isAuthenticated, token]);

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Navigate to="/dashboard" replace />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Layout>
              <Dashboard />
            </Layout>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/equipment"
        element={
          <ProtectedRoute>
            <Layout>
              <EquipmentList />
            </Layout>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/equipment/:id"
        element={
          <ProtectedRoute>
            <Layout>
              <EquipmentDetail />
            </Layout>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/fields"
        element={
          <ProtectedRoute>
            <Layout>
              <Fields />
            </Layout>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/reservations"
        element={
          <ProtectedRoute>
            <Layout>
              <Reservations />
            </Layout>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/reservations/new"
        element={
          <ProtectedRoute roles={['member', 'admin']}>
            <Layout>
              <NewReservation />
            </Layout>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/work"
        element={
          <ProtectedRoute roles={['operator', 'admin']}>
            <Layout>
              <Work />
            </Layout>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/maintenance"
        element={
          <ProtectedRoute roles={['operator', 'admin']}>
            <Layout>
              <Maintenance />
            </Layout>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/settlement"
        element={
          <ProtectedRoute roles={['member', 'admin']}>
            <Layout>
              <Settlement />
            </Layout>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/audit"
        element={
          <ProtectedRoute roles={['admin']}>
            <Layout>
              <AuditLogs />
            </Layout>
          </ProtectedRoute>
        }
      />
      
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;
