import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import MainLayout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Brands from './pages/Brands'
import Orders from './pages/Orders'
import OrderDetail from './pages/OrderDetail'
import Schedules from './pages/Schedules'
import DeliveryNodes from './pages/DeliveryNodes'
import BrandQuotes from './pages/BrandQuotes'
import Contracts from './pages/Contracts'
import Payments from './pages/Payments'
import WorkAuthorization from './pages/WorkAuthorization'
import Members from './pages/Members'
import Subscriptions from './pages/Subscriptions'
import Sponsorships from './pages/Sponsorships'
import ExceptionPool from './pages/ExceptionPool'
import PhotoSelection from './pages/PhotoSelection'
import FinalDelivery from './pages/FinalDelivery'
import SyncLogs from './pages/SyncLogs'

function App() {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        
        <Route path="brands" element={<Brands />} />
        <Route path="orders" element={<Orders />} />
        <Route path="orders/:id" element={<OrderDetail />} />
        <Route path="schedules" element={<Schedules />} />
        <Route path="delivery-nodes" element={<DeliveryNodes />} />
        <Route path="brand-quotes" element={<BrandQuotes />} />
        <Route path="contracts" element={<Contracts />} />
        <Route path="payments" element={<Payments />} />
        <Route path="work-authorization" element={<WorkAuthorization />} />
        
        <Route path="members" element={<Members />} />
        <Route path="subscriptions" element={<Subscriptions />} />
        <Route path="sponsorships" element={<Sponsorships />} />
        
        <Route path="exception-pool" element={<ExceptionPool />} />
        <Route path="sync-logs" element={<SyncLogs />} />
        
        <Route path="photo-selection/:orderId" element={<PhotoSelection />} />
        <Route path="final-delivery/:orderId" element={<FinalDelivery />} />
      </Route>
    </Routes>
  )
}

export default App
