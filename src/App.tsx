import { useEffect, type ReactNode } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import Layout from '@/components/Layout'
import Login from '@/pages/Login'
import Dashboard from '@/pages/Dashboard'
import FarmRecords from '@/pages/FarmRecords'
import FarmRecordForm from '@/pages/FarmRecordForm'
import FarmRecordDetail from '@/pages/FarmRecordDetail'
import Harvests from '@/pages/Harvests'
import HarvestForm from '@/pages/HarvestForm'
import HarvestDetail from '@/pages/HarvestDetail'
import Traceability from '@/pages/Traceability'
import Plots from '@/pages/Plots'
import PlotForm from '@/pages/PlotForm'
import PlotDetail from '@/pages/PlotDetail'
import Varieties from '@/pages/Varieties'
import VarietyForm from '@/pages/VarietyForm'
import VarietyDetail from '@/pages/VarietyDetail'
import SortingOrders from '@/pages/SortingOrders'
import SortingOrderForm from '@/pages/SortingOrderForm'
import SortingOrderDetail from '@/pages/SortingOrderDetail'
import Orders from '@/pages/Orders'
import OrderForm from '@/pages/OrderForm'
import OrderDetail from '@/pages/OrderDetail'
import Declarations from '@/pages/Declarations'
import DeclarationDetail from '@/pages/DeclarationDetail'
import Roles from '@/pages/admin/Roles'
import Logs from '@/pages/admin/Logs'
import Export from '@/pages/admin/Export'
import Alerts from '@/pages/admin/Alerts'

function Placeholder({ title }: { title: string }) {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-gray-700 mb-2">{title}</h2>
        <p className="text-gray-400">功能开发中...</p>
      </div>
    </div>
  )
}

function ProtectedRoute({ children }: { children: ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <>{children}</>
}

function AuthRedirect({ children }: { children: ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }
  return <>{children}</>
}

function AuthInitializer({ children }: { children: ReactNode }) {
  const checkAuth = useAuthStore((s) => s.checkAuth)
  const isLoading = useAuthStore((s) => s.isLoading)

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="skeleton h-8 w-32" />
      </div>
    )
  }

  return <>{children}</>
}

export default function App() {
  return (
    <Router>
      <AuthInitializer>
        <Routes>
          <Route
            path="/login"
            element={
              <AuthRedirect>
                <Login />
              </AuthRedirect>
            }
          />
          <Route
            path="/traceability/:batchNo"
            element={<Placeholder title="溯源查询" />}
          />
          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<Dashboard />} />
            <Route path="/plots" element={<Plots />} />
            <Route path="/plots/new" element={<PlotForm />} />
            <Route path="/plots/:id" element={<PlotDetail />} />
            <Route path="/varieties" element={<Varieties />} />
            <Route path="/varieties/new" element={<VarietyForm />} />
            <Route path="/varieties/:id" element={<VarietyDetail />} />
            <Route path="/farm-records" element={<FarmRecords />} />
            <Route path="/farm-records/new" element={<FarmRecordForm />} />
            <Route path="/farm-records/:id" element={<FarmRecordDetail />} />
            <Route path="/harvests" element={<Harvests />} />
            <Route path="/harvests/new" element={<HarvestForm />} />
            <Route path="/harvests/:id" element={<HarvestDetail />} />
            <Route path="/sorting-orders" element={<Placeholder title="分拣订单" />} />
            <Route path="/sorting-orders/new" element={<Placeholder title="新建分拣订单" />} />
            <Route path="/sorting-orders/:id" element={<Placeholder title="分拣订单详情" />} />
            <Route path="/orders" element={<Placeholder title="订单履约" />} />
            <Route path="/orders/new" element={<Placeholder title="新建订单" />} />
            <Route path="/orders/:id" element={<Placeholder title="订单详情" />} />
            <Route path="/declarations" element={<Placeholder title="申报材料" />} />
            <Route path="/declarations/:id" element={<Placeholder title="申报材料详情" />} />
            <Route path="/admin/roles" element={<Roles />} />
            <Route path="/admin/logs" element={<Logs />} />
            <Route path="/admin/export" element={<Export />} />
            <Route path="/admin/alerts" element={<Alerts />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthInitializer>
    </Router>
  )
}
