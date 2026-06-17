import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useUserStore } from './store/userStore'
import MainLayout from './layouts/MainLayout'
import Login from './pages/Login'
import RequirementList from './pages/RequirementList'
import RequirementDetail from './pages/RequirementDetail'
import RequirementCreate from './pages/RequirementCreate'
import Statistics from './pages/Statistics'
import DelayRecords from './pages/DelayRecords'
import OperationLogs from './pages/OperationLogs'

function App() {
  const isLoggedIn = useUserStore((state) => state.isLoggedIn)

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          isLoggedIn ? <MainLayout /> : <Navigate to="/login" replace />
        }
      >
        <Route index element={<Navigate to="/requirements" replace />} />
        <Route path="requirements" element={<RequirementList />} />
        <Route path="requirements/create" element={<RequirementCreate />} />
        <Route path="requirements/:id" element={<RequirementDetail />} />
        <Route path="statistics" element={<Statistics />} />
        <Route path="delays" element={<DelayRecords />} />
        <Route path="logs" element={<OperationLogs />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
