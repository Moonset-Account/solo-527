import React, { useEffect } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store'
import MainLayout from '@/components/Layout/MainLayout'
import Login from '@/pages/Login'
import Dashboard from '@/pages/Dashboard'
import Consumables from '@/pages/consumables/List'
import ConsumableForm from '@/pages/consumables/Form'
import MonthlyUsage from '@/pages/consumables/MonthlyUsage'
import Contracts from '@/pages/contracts/List'
import ContractForm from '@/pages/contracts/Form'
import ContractDetail from '@/pages/contracts/Detail'
import Suppliers from '@/pages/suppliers/List'
import SupplierForm from '@/pages/suppliers/Form'
import SupplierDetail from '@/pages/suppliers/Detail'
import Invoices from '@/pages/invoices/List'
import InvoiceForm from '@/pages/invoices/Form'
import Approvals from '@/pages/approvals/List'
import PriceBoard from '@/pages/PriceBoard'
import Settings from '@/pages/Settings'

const PrivateRoute = ({ children }) => {
  const { isAuthenticated } = useAuthStore()
  const location = useLocation()
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }
  return children
}

function App() {
  const fetchUser = async () => {
    const { isAuthenticated, token, setUser } = useAuthStore.getState()
    if (isAuthenticated && token) {
      try {
        const { authApi } = await import('@/api/endpoints')
        const res = await authApi.getCurrentUser()
        setUser(res.data)
      } catch (e) {
        useAuthStore.getState().logout()
      }
    }
  }

  useEffect(() => {
    fetchUser()
  }, [])

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<PrivateRoute><MainLayout /></PrivateRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="consumables" element={<Consumables />} />
        <Route path="consumables/new" element={<ConsumableForm />} />
        <Route path="consumables/:id/edit" element={<ConsumableForm />} />
        <Route path="consumables/monthly-usage" element={<MonthlyUsage />} />
        <Route path="contracts" element={<Contracts />} />
        <Route path="contracts/new" element={<ContractForm />} />
        <Route path="contracts/:id/edit" element={<ContractForm />} />
        <Route path="contracts/:id" element={<ContractDetail />} />
        <Route path="suppliers" element={<Suppliers />} />
        <Route path="suppliers/new" element={<SupplierForm />} />
        <Route path="suppliers/:id/edit" element={<SupplierForm />} />
        <Route path="suppliers/:id" element={<SupplierDetail />} />
        <Route path="invoices" element={<Invoices />} />
        <Route path="invoices/new" element={<InvoiceForm />} />
        <Route path="approvals" element={<Approvals />} />
        <Route path="price-board" element={<PriceBoard />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  )
}

export default App
