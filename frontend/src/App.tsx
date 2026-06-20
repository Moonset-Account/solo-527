import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/auth'
import Login from './pages/Login'
import MainLayout from './layouts/MainLayout'
import Dashboard from './pages/Dashboard'
import AlertList from './pages/alerts/AlertList'
import AlertDetail from './pages/alerts/AlertDetail'
import AssetList from './pages/assets/AssetList'
import InspectionTemplateList from './pages/inspections/InspectionTemplateList'
import InspectionTaskList from './pages/inspections/InspectionTaskList'
import ChangeWindowList from './pages/changes/ChangeWindowList'
import ChangeWindowDetail from './pages/changes/ChangeWindowDetail'
import DictionaryList from './pages/dictionaries/DictionaryList'
import UserList from './pages/users/UserList'
import AuditLogList from './pages/audits/AuditLogList'
import NotificationRuleList from './pages/notifications/NotificationRuleList'

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const token = useAuthStore(state => state.token)
  return token ? <>{children}</> : <Navigate to="/login" replace />
}

const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={
        <PrivateRoute>
          <MainLayout />
        </PrivateRoute>
      }>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="alerts" element={<AlertList />} />
        <Route path="alerts/:id" element={<AlertDetail />} />
        <Route path="assets" element={<AssetList />} />
        <Route path="inspections/templates" element={<InspectionTemplateList />} />
        <Route path="inspections/tasks" element={<InspectionTaskList />} />
        <Route path="changes" element={<ChangeWindowList />} />
        <Route path="changes/:id" element={<ChangeWindowDetail />} />
        <Route path="dictionaries" element={<DictionaryList />} />
        <Route path="users" element={<UserList />} />
        <Route path="audits" element={<AuditLogList />} />
        <Route path="notifications/rules" element={<NotificationRuleList />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default App
