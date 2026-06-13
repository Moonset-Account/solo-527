import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import MainLayout from './layouts/MainLayout'
import LoginPage from './pages/Login'
import PurchaseRequestList from './pages/purchase/List'
import PurchaseRequestForm from './pages/purchase/Form'
import PurchaseRequestDetail from './pages/purchase/Detail'
import ApprovalCenter from './pages/approval/Center'
import ApprovalConfig from './pages/approval/Config'
import PriceAlert from './pages/price/Alert'
import PriceHistory from './pages/price/History'
import PriceReview from './pages/price/Review'
import Tracking from './pages/tracking/Index'
import PaymentAlert from './pages/payment/Alert'
import RiskBoard from './pages/payment/RiskBoard'
import BatchUpdate from './pages/batch/Update'
import BatchLogs from './pages/batch/Logs'
import SupplierList from './pages/supplier/List'

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token')
  return token ? children : <Navigate to="/login" replace />
}

const App = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<Navigate to="/purchase-requests" replace />} />
      <Route path="/" element={
        <PrivateRoute>
          <MainLayout />
        </PrivateRoute>
      }>
        <Route path="purchase-requests" element={<PurchaseRequestList />} />
        <Route path="purchase-requests/new" element={<PurchaseRequestForm />} />
        <Route path="purchase-requests/edit/:id" element={<PurchaseRequestForm />} />
        <Route path="purchase-requests/:id" element={<PurchaseRequestDetail />} />
        
        <Route path="approvals" element={<ApprovalCenter />} />
        <Route path="approval-config" element={<ApprovalConfig />} />
        
        <Route path="price" element={<PriceAlert />} />
        <Route path="price/history" element={<PriceHistory />} />
        <Route path="price/review" element={<PriceReview />} />
        
        <Route path="tracking" element={<Tracking />} />
        
        <Route path="payment" element={<PaymentAlert />} />
        <Route path="payment/risk-board" element={<RiskBoard />} />
        
        <Route path="batch" element={<BatchUpdate />} />
        <Route path="batch/logs" element={<BatchLogs />} />
        
        <Route path="suppliers" element={<SupplierList />} />
      </Route>
    </Routes>
  )
}

export default App
