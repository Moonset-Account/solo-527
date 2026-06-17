import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './components/MainLayout';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import BudgetDashboard from './pages/BudgetDashboard';
import Projects from './pages/Projects';
import Quotations from './pages/Quotations';
import Budgets from './pages/Budgets';
import Materials from './pages/Materials';
import Inspections from './pages/Inspections';
import Repairs from './pages/Repairs';
import SearchHub from './pages/SearchHub';

const App = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainLayout>
              <Navigate to="/dashboard" replace />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <MainLayout>
              <BudgetDashboard />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/projects"
        element={
          <ProtectedRoute>
            <MainLayout>
              <Projects />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/quotations"
        element={
          <ProtectedRoute>
            <MainLayout>
              <Quotations />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/budgets"
        element={
          <ProtectedRoute allowedRoles={['admin', 'project_manager', 'finance']}>
            <MainLayout>
              <Budgets />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/budgets/:id"
        element={
          <ProtectedRoute>
            <MainLayout>
              <Budgets />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/materials"
        element={
          <ProtectedRoute>
            <MainLayout>
              <Materials />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/material-lists"
        element={
          <ProtectedRoute>
            <MainLayout>
              <Materials />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/inspections"
        element={
          <ProtectedRoute>
            <MainLayout>
              <Inspections />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/repairs"
        element={
          <ProtectedRoute>
            <MainLayout>
              <Repairs />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/search"
        element={
          <ProtectedRoute>
            <MainLayout>
              <SearchHub />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

export default App;
