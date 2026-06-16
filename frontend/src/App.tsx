import { useEffect } from 'react'
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth'
import MainLayout from '@/layouts/MainLayout'
import Login from '@/pages/Login'
import RepairList from '@/pages/student/RepairList'
import RepairSubmit from '@/pages/student/RepairSubmit'
import RepairDetail from '@/pages/student/RepairDetail'
import Notifications from '@/pages/common/Notifications'
import Announcements from '@/pages/common/Announcements'
import StudyRooms from '@/pages/common/StudyRooms'
import Profile from '@/pages/common/Profile'
import Dashboard from '@/pages/admin/Dashboard'
import AdminRepairs from '@/pages/admin/AdminRepairs'
import AdminRepairDetail from '@/pages/admin/AdminRepairDetail'
import PushNotification from '@/pages/admin/PushNotification'
import AnnouncementManage from '@/pages/admin/AnnouncementManage'
import UserManage from '@/pages/admin/UserManage'
import RoleConfig from '@/pages/admin/RoleConfig'
import AuditLogs from '@/pages/admin/AuditLogs'
import SeatManage from '@/pages/dorm/SeatManage'
import UserVerify from '@/pages/dorm/UserVerify'
import CheckIn from '@/pages/dorm/CheckIn'

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { token, user, fetchUser } = useAuthStore()
  const location = useLocation()

  useEffect(() => {
    if (token && !user) {
      fetchUser()
    }
  }, [token, user, fetchUser])

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }
  return <>{children}</>
}

function RequireRole({ children, roles }: { children: React.ReactNode; roles: string[] }) {
  const { user } = useAuthStore()
  if (!user || !roles.includes(user.role)) {
    return <Navigate to="/" replace />
  }
  return <>{children}</>
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <RequireAuth>
            <MainLayout />
          </RequireAuth>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="repairs" element={<RepairList />} />
        <Route path="repairs/submit" element={<RepairSubmit />} />
        <Route path="repairs/:id" element={<RepairDetail />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="announcements" element={<Announcements />} />
        <Route path="study-rooms" element={<StudyRooms />} />
        <Route path="profile" element={<Profile />} />

        <Route
          path="admin/repairs"
          element={
            <RequireRole roles={['admin', 'dorm_manager', 'maintenance']}>
              <AdminRepairs />
            </RequireRole>
          }
        />
        <Route
          path="admin/repairs/:id"
          element={
            <RequireRole roles={['admin', 'dorm_manager', 'maintenance']}>
              <AdminRepairDetail />
            </RequireRole>
          }
        />
        <Route
          path="admin/push"
          element={
            <RequireRole roles={['admin', 'dorm_manager']}>
              <PushNotification />
            </RequireRole>
          }
        />
        <Route
          path="admin/announcements"
          element={
            <RequireRole roles={['admin', 'dorm_manager']}>
              <AnnouncementManage />
            </RequireRole>
          }
        />
        <Route
          path="admin/users"
          element={
            <RequireRole roles={['admin', 'dorm_manager']}>
              <UserManage />
            </RequireRole>
          }
        />
        <Route
          path="admin/roles"
          element={
            <RequireRole roles={['admin']}>
              <RoleConfig />
            </RequireRole>
          }
        />
        <Route
          path="admin/audit"
          element={
            <RequireRole roles={['admin']}>
              <AuditLogs />
            </RequireRole>
          }
        />
        <Route
          path="dorm/seats"
          element={
            <RequireRole roles={['admin', 'dorm_manager']}>
              <SeatManage />
            </RequireRole>
          }
        />
        <Route
          path="dorm/verify"
          element={
            <RequireRole roles={['admin', 'dorm_manager']}>
              <UserVerify />
            </RequireRole>
          }
        />
        <Route
          path="dorm/checkin"
          element={
            <RequireRole roles={['admin', 'dorm_manager']}>
              <CheckIn />
            </RequireRole>
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
