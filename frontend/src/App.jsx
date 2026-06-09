import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store'
import MainLayout from './layouts/MainLayout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import DataImport from './pages/DataImport'
import ScoringWorkbench from './pages/ScoringWorkbench'
import Callbacks from './pages/Callbacks'
import Feedback from './pages/Feedback'
import ErrorSamples from './pages/ErrorSamples'
import ModelManagement from './pages/ModelManagement'
import SmsTemplates from './pages/SmsTemplates'

const ProtectedRoute = ({ children }) => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  return children
}

const App = () => {
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
        <Route path="data-import" element={<DataImport />} />
        <Route path="scoring" element={<ScoringWorkbench />} />
        <Route path="callbacks" element={<Callbacks />} />
        <Route path="feedback" element={<Feedback />} />
        <Route path="error-samples" element={<ErrorSamples />} />
        <Route path="models" element={<ModelManagement />} />
        <Route path="sms-templates" element={<SmsTemplates />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default App
