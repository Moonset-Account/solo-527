import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ClientLayout from './layouts/ClientLayout';
import AdminLayout from './layouts/AdminLayout';
import Home from './pages/client/Home';
import CounselorList from './pages/client/CounselorList';
import CounselorDetail from './pages/client/CounselorDetail';
import AppointmentForm from './pages/client/AppointmentForm';
import MyAppointments from './pages/client/MyAppointments';
import MyWaitlist from './pages/client/MyWaitlist';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/admin/Dashboard';
import AppointmentManage from './pages/admin/AppointmentManage';
import WaitlistManage from './pages/admin/WaitlistManage';
import WaitlistRulesManage from './pages/admin/WaitlistRulesManage';
import ServiceManage from './pages/admin/ServiceManage';
import ScheduleManage from './pages/admin/ScheduleManage';
import RefundManage from './pages/admin/RefundManage';
import CounselorManage from './pages/admin/CounselorManage';
import UserManage from './pages/admin/UserManage';
import ProcessingRecords from './pages/admin/ProcessingRecords';
import CrossDeptReport from './pages/admin/CrossDeptReport';

function PrivateRoute({ children, requiredRole }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>加载中...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user.role !== requiredRole && user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return children;
}

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route path="/" element={<ClientLayout />}>
          <Route index element={<Home />} />
          <Route path="counselors" element={<CounselorList />} />
          <Route path="counselors/:id" element={<CounselorDetail />} />
          <Route
            path="appointment/new"
            element={
              <PrivateRoute>
                <AppointmentForm />
              </PrivateRoute>
            }
          />
          <Route
            path="my-appointments"
            element={
              <PrivateRoute>
                <MyAppointments />
              </PrivateRoute>
            }
          />
          <Route
            path="my-waitlist"
            element={
              <PrivateRoute>
                <MyWaitlist />
              </PrivateRoute>
            }
          />
        </Route>

        <Route
          path="/admin"
          element={
            <PrivateRoute requiredRole="dispatcher">
              <AdminLayout />
            </PrivateRoute>
          }
        >
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="appointments" element={<AppointmentManage />} />
          <Route path="waitlist" element={<WaitlistManage />} />
          <Route path="waitlist-rules" element={<WaitlistRulesManage />} />
          <Route path="services" element={<ServiceManage />} />
          <Route path="schedules" element={<ScheduleManage />} />
          <Route path="refunds" element={<RefundManage />} />
          <Route path="counselors" element={<CounselorManage />} />
          <Route path="users" element={<UserManage />} />
          <Route path="processing-records" element={<ProcessingRecords />} />
          <Route path="cross-dept-report" element={<CrossDeptReport />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
