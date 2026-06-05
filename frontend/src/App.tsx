import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './store/authStore';
import Layout from './components/Layout';
import RouteGuard from './components/RouteGuard';
import Login from './pages/Login';
import AdminDashboard from './pages/admin/Dashboard';
import ChildList from './pages/admin/ChildList';
import StaffList from './pages/admin/StaffList';
import PaymentOverview from './pages/admin/PaymentOverview';
import AuditLog from './pages/admin/AuditLog';
import TeacherDashboard from './pages/teacher/Dashboard';
import DailyRecordForm from './pages/teacher/DailyRecordForm';
import PickupVerify from './pages/teacher/PickupVerify';
import GrowthAlbum from './pages/teacher/GrowthAlbum';
import LeaveManage from './pages/teacher/LeaveManage';
import ParentDashboard from './pages/parent/Dashboard';
import MyChild from './pages/parent/MyChild';
import PickupAuth from './pages/parent/PickupAuth';
import LeaveRequest from './pages/parent/LeaveRequest';
import PaymentList from './pages/parent/PaymentList';

function RootRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  const roleDashboards: Record<string, string> = {
    admin: '/admin',
    teacher: '/teacher',
    parent: '/parent',
  };
  return <Navigate to={roleDashboards[user.role] || '/login'} replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/admin"
          element={
            <RouteGuard allowedRoles={['admin']}>
              <Layout />
            </RouteGuard>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="children" element={<ChildList />} />
          <Route path="staff" element={<StaffList />} />
          <Route path="payments" element={<PaymentOverview />} />
          <Route path="audit-log" element={<AuditLog />} />
        </Route>
        <Route
          path="/teacher"
          element={
            <RouteGuard allowedRoles={['teacher']}>
              <Layout />
            </RouteGuard>
          }
        >
          <Route index element={<TeacherDashboard />} />
          <Route path="daily-record" element={<DailyRecordForm />} />
          <Route path="pickup-verify" element={<PickupVerify />} />
          <Route path="growth-album" element={<GrowthAlbum />} />
          <Route path="leave-manage" element={<LeaveManage />} />
        </Route>
        <Route
          path="/parent"
          element={
            <RouteGuard allowedRoles={['parent']}>
              <Layout />
            </RouteGuard>
          }
        >
          <Route index element={<ParentDashboard />} />
          <Route path="my-child" element={<MyChild />} />
          <Route path="pickup-auth" element={<PickupAuth />} />
          <Route path="leave-request" element={<LeaveRequest />} />
          <Route path="payments" element={<PaymentList />} />
        </Route>
        <Route path="/" element={<RootRedirect />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
