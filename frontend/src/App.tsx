import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth'
import MainLayout from '@/components/layout/MainLayout'
import Login from '@/pages/Login'
import Dashboard from '@/pages/Dashboard'
import ChildrenList from '@/pages/children/List'
import ChildDetail from '@/pages/children/Detail'
import PickupVerify from '@/pages/pickup/Verify'
import PickupRecords from '@/pages/pickup/Records'
import DailyRecords from '@/pages/daily/List'
import GrowthRecords from '@/pages/daily/Growth'
import Notifications from '@/pages/notifications/List'
import NotificationDetail from '@/pages/notifications/Detail'
import Messages from '@/pages/notifications/Messages'
import LeaveList from '@/pages/leave/List'
import LeaveCreate from '@/pages/leave/Create'
import Payments from '@/pages/payments/List'
import PaymentCreate from '@/pages/payments/Create'

const PrivateRoute = ({ children }: { children: JSX.Element }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  return isAuthenticated ? children : <Navigate to="/login" replace />
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <MainLayout />
          </PrivateRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="children" element={<ChildrenList />} />
        <Route path="children/:id" element={<ChildDetail />} />
        <Route path="pickup/verify" element={<PickupVerify />} />
        <Route path="pickup/records" element={<PickupRecords />} />
        <Route path="daily" element={<DailyRecords />} />
        <Route path="growth" element={<GrowthRecords />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="notifications/:id" element={<NotificationDetail />} />
        <Route path="messages" element={<Messages />} />
        <Route path="leave" element={<LeaveList />} />
        <Route path="leave/create" element={<LeaveCreate />} />
        <Route path="payments" element={<Payments />} />
        <Route path="payments/create" element={<PaymentCreate />} />
      </Route>
    </Routes>
  )
}

export default App
