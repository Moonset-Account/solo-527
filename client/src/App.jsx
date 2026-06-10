import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import MainLayout from '@/layouts/MainLayout'
import BlankLayout from '@/layouts/BlankLayout'
import Login from '@/pages/Login'
import Dashboard from '@/pages/Dashboard'
import Worker from '@/pages/Worker'
import EventManage from '@/pages/EventManage'
import Facilities from '@/pages/Facilities'
import UserManage from '@/pages/UserManage'
import OperationLogs from '@/pages/OperationLogs'
import { isAuthenticated, getUser } from '@/utils/auth'

const PrivateRoute = ({ children, allowedRoles }) => {
  const user = getUser()

  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles && allowedRoles.length > 0) {
    if (!allowedRoles.includes(user?.role)) {
      if (user?.role === 'ADMIN') {
        return <Navigate to="/dashboard" replace />
      } else {
        return <Navigate to="/worker" replace />
      }
    }
  }

  return children
}

const IndexRedirect = () => {
  const user = getUser()
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />
  }
  if (user?.role === 'ADMIN') {
    return <Navigate to="/dashboard" replace />
  }
  return <Navigate to="/worker" replace />
}

function App() {
  return (
    <Routes>
      <Route element={<BlankLayout />}>
        <Route path="/login" element={<Login />} />
      </Route>

      <Route
        path="/"
        element={
          <PrivateRoute>
            <MainLayout />
          </PrivateRoute>
        }
      >
        <Route index element={<IndexRedirect />} />

        <Route
          path="dashboard"
          element={
            <PrivateRoute allowedRoles={['ADMIN']}>
              <Dashboard />
            </PrivateRoute>
          }
        />

        <Route
          path="events"
          element={
            <PrivateRoute allowedRoles={['ADMIN']}>
              <EventManage />
            </PrivateRoute>
          }
        />

        <Route path="facilities" element={<Facilities />} />

        <Route
          path="users"
          element={
            <PrivateRoute allowedRoles={['ADMIN']}>
              <UserManage />
            </PrivateRoute>
          }
        />

        <Route
          path="operation-logs"
          element={
            <PrivateRoute allowedRoles={['ADMIN']}>
              <OperationLogs />
            </PrivateRoute>
          }
        />

        <Route
          path="worker"
          element={
            <PrivateRoute allowedRoles={['GRID_WORKER']}>
              <Worker />
            </PrivateRoute>
          }
        />
      </Route>

      <Route path="*" element={<IndexRedirect />} />
    </Routes>
  )
}

export default App
