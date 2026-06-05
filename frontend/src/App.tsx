import { Routes, Route, Navigate } from 'react-router-dom'
import { useUserStore } from './store/useUserStore'
import Login from './pages/Login'
import MainLayout from './layouts/MainLayout'
import Dashboard from './pages/Dashboard'
import MemberList from './pages/MemberList'
import BookingList from './pages/BookingList'
import CoachList from './pages/CoachList'
import MobileBooking from './pages/mobile/MobileBooking'

function App() {
  const { token } = useUserStore()

  const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
    if (!token) {
      return <Navigate to="/login" replace />
    }
    return children
  }

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
        <Route path="members" element={<MemberList />} />
        <Route path="bookings" element={<BookingList />} />
        <Route path="coaches" element={<CoachList />} />
      </Route>
      <Route path="/m/booking" element={<MobileBooking />} />
    </Routes>
  )
}

export default App
