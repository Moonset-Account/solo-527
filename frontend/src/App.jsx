import React, { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { addNotification } from '@/store'
import Layout from '@/components/Layout'
import Login from '@/pages/Login'
import Dashboard from '@/pages/Dashboard'
import AnomalyList from '@/pages/AnomalyList'
import AlertRules from '@/pages/AlertRules'
import DimensionConfig from '@/pages/DimensionConfig'
import DatasetPermissions from '@/pages/DatasetPermissions'
import DesensitizationConfig from '@/pages/DesensitizationConfig'
import ApprovalList from '@/pages/ApprovalList'
import DataDelayMonitor from '@/pages/DataDelayMonitor'
import ReportEfficiency from '@/pages/ReportEfficiency'
import FilterTemplates from '@/pages/FilterTemplates'
import { delayApi } from '@/services/api'

const PrivateRoute = ({ children }) => {
  const token = useSelector((state) => state.auth.token)
  return token ? children : <Navigate to="/login" />
}

function App() {
  const dispatch = useDispatch()
  const token = useSelector((state) => state.auth.token)

  useEffect(() => {
    if (!token) return

    const checkNotifications = async () => {
      try {
        const notifications = await delayApi.getNotifications()
        if (notifications && notifications.length > 0) {
          notifications.forEach((notification) => {
            dispatch(addNotification(notification))
          })
        }
      } catch (error) {
        console.error('获取通知失败', error)
      }
    }

    checkNotifications()
    const interval = setInterval(checkNotifications, 60000)
    return () => clearInterval(interval)
  }, [token, dispatch])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="anomalies" element={<AnomalyList />} />
          <Route path="alert-rules" element={<AlertRules />} />
          <Route path="dimensions" element={<DimensionConfig />} />
          <Route path="dataset-permissions" element={<DatasetPermissions />} />
          <Route path="desensitization" element={<DesensitizationConfig />} />
          <Route path="approvals" element={<ApprovalList />} />
          <Route path="data-delay" element={<DataDelayMonitor />} />
          <Route path="report-efficiency" element={<ReportEfficiency />} />
          <Route path="filter-templates" element={<FilterTemplates />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
