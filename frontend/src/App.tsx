import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/auth'
import Login from './pages/Login'
import MainLayout from './layouts/MainLayout'
import Dashboard from './pages/Dashboard'
import Calendar from './pages/Calendar'
import CleaningTasks from './pages/CleaningTasks'
import MaintenanceOrders from './pages/MaintenanceOrders'
import Properties from './pages/Properties'
import Materials from './pages/Materials'
import Reports from './pages/Reports'
import Users from './pages/Users'

function App() {
  const { token } = useAuthStore()

  return (
    <Routes>
      <Route path="/login" element={!token ? <Login /> : <Navigate to="/" />} />
      <Route
        path="/*"
        element={
          token ? (
            <MainLayout>
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/calendar" element={<Calendar />} />
                <Route path="/cleaning-tasks" element={<CleaningTasks />} />
                <Route path="/maintenance-orders" element={<MaintenanceOrders />} />
                <Route path="/properties" element={<Properties />} />
                <Route path="/materials" element={<Materials />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/users" element={<Users />} />
              </Routes>
            </MainLayout>
          ) : (
            <Navigate to="/login" />
          )
        }
      />
    </Routes>
  )
}

export default App
