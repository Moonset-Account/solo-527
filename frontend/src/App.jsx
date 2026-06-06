import { Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { Spin } from 'antd'
import UserLayout from './layouts/UserLayout'
import AdminLayout from './layouts/AdminLayout'
import Login from './pages/Login'
import Register from './pages/Register'

import UserProducts from './pages/user/Products'
import UserOrders from './pages/user/Orders'
import UserOrderDetail from './pages/user/OrderDetail'
import UserShortages from './pages/user/Shortages'
import UserRefunds from './pages/user/Refunds'

import AdminDashboard from './pages/admin/Dashboard'
import AdminOrders from './pages/admin/Orders'
import AdminShortages from './pages/admin/Shortages'
import AdminRefunds from './pages/admin/Refunds'
import AdminSorting from './pages/admin/Sorting'
import AdminPickup from './pages/admin/Pickup'
import AdminProducts from './pages/admin/Products'
import AdminBuildings from './pages/admin/Buildings'
import AdminUsers from './pages/admin/Users'

function App() {
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    const userStr = localStorage.getItem('user')
    if (token && userStr) {
      setUser(JSON.parse(userStr))
    }
    setLoading(false)
  }, [])

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" />
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      
      <Route path="/" element={<UserLayout />}>
        <Route index element={<Navigate to="/products" replace />} />
        <Route path="products" element={<UserProducts />} />
        <Route path="orders" element={<UserOrders />} />
        <Route path="orders/:id" element={<UserOrderDetail />} />
        <Route path="shortages" element={<UserShortages />} />
        <Route path="refunds" element={<UserRefunds />} />
      </Route>
      
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="orders" element={<AdminOrders />} />
        <Route path="shortages" element={<AdminShortages />} />
        <Route path="refunds" element={<AdminRefunds />} />
        <Route path="sorting" element={<AdminSorting />} />
        <Route path="pickup" element={<AdminPickup />} />
        <Route path="products" element={<AdminProducts />} />
        <Route path="buildings" element={<AdminBuildings />} />
        <Route path="users" element={<AdminUsers />} />
      </Route>
      
      <Route path="*" element={<Navigate to="/products" replace />} />
    </Routes>
  )
}

export default App
