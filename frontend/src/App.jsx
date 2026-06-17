import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import MainLayout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Scan from './pages/Scan'
import Equipment from './pages/Equipment'
import Process from './pages/Process'
import WorkOrder from './pages/WorkOrder'
import ProductionPlan from './pages/ProductionPlan'
import Utilization from './pages/Utilization'
import Rework from './pages/Rework'
import Material from './pages/Material'
import Notification from './pages/Notification'
import Logs from './pages/Logs'
import ImportData from './pages/Import'
import Users from './pages/Users'

const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { user, loading } = useAuth()

  if (loading) {
    return <div style={{ padding: 50, textAlign: 'center' }}>加载中...</div>
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (requireAdmin && user.role !== 'ADMIN') {
    return <Navigate to="/" replace />
  }

  return children
}

const AppRoutes = () => {
  const { user } = useAuth()

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="scan" element={<Scan />} />
        <Route path="equipments" element={<Equipment />} />
        <Route path="processes" element={<Process />} />
        <Route path="workorders" element={<WorkOrder />} />
        <Route path="plans" element={<ProductionPlan />} />
        <Route path="utilization" element={<Utilization />} />
        <Route path="reworks" element={<Rework />} />
        <Route path="materials" element={<Material />} />
        <Route path="notifications" element={<Notification />} />
        <Route
          path="logs"
          element={
            <ProtectedRoute requireAdmin>
              <Logs />
            </ProtectedRoute>
          }
        />
        <Route path="import" element={<ImportData />} />
        <Route
          path="users"
          element={
            <ProtectedRoute requireAdmin>
              <Users />
            </ProtectedRoute>
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

const App = () => {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}

export default App
