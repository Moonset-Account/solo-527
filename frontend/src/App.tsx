import { Routes, Route } from 'react-router-dom'
import RouteGuard from './components/RouteGuard'
import Login from './pages/Login'
import MainLayout from './layouts/MainLayout'
import Dashboard from './pages/Dashboard'
import MemberList from './pages/members/MemberList'
import CoachList from './pages/coaches/CoachList'
import PackageList from './pages/packages/PackageList'
import GroupClassList from './pages/group-classes/GroupClassList'
import BookingList from './pages/bookings/BookingList'
import FreezeList from './pages/freezes/FreezeList'
import MeasurementList from './pages/measurements/MeasurementList'
import Forbidden from './pages/Forbidden'
import NotFound from './pages/NotFound'

const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/403" element={<Forbidden />} />
      <Route
        path="/"
        element={
          <RouteGuard>
            <MainLayout />
          </RouteGuard>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="members" element={<MemberList />} />
        <Route
          path="coaches"
          element={
            <RouteGuard roles={['ADMIN', 'RECEPTIONIST']}>
              <CoachList />
            </RouteGuard>
          }
        />
        <Route path="packages" element={<PackageList />} />
        <Route path="group-classes" element={<GroupClassList />} />
        <Route path="bookings" element={<BookingList />} />
        <Route path="freezes" element={<FreezeList />} />
        <Route path="measurements" element={<MeasurementList />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default App
