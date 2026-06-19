import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/auth';
import { UserRole } from './types';
import Login from './pages/Login';
import FrontLayout from './layouts/FrontLayout';
import AdminLayout from './layouts/AdminLayout';
import SpaceList from './pages/front/SpaceList';
import SpaceDetail from './pages/front/SpaceDetail';
import MyAppointments from './pages/front/MyAppointments';
import MyContracts from './pages/front/MyContracts';
import MyBills from './pages/front/MyBills';
import Dashboard from './pages/admin/Dashboard';
import AppointmentList from './pages/admin/AppointmentList';
import AppointmentDetail from './pages/admin/AppointmentDetail';
import NoShowList from './pages/admin/NoShowList';
import SpaceManage from './pages/admin/SpaceManage';
import ContractList from './pages/admin/ContractList';
import ContractDetail from './pages/admin/ContractDetail';
import BillList from './pages/admin/BillList';
import OrderList from './pages/admin/OrderList';
import OrderDetail from './pages/admin/OrderDetail';
import OperationLogs from './pages/admin/OperationLogs';

function App() {
  const { isAuthenticated, user } = useAuthStore();

  const ProtectedRoute = ({ children, roles }: { children: JSX.Element; roles?: UserRole[] }) => {
    if (!isAuthenticated) return <Navigate to="/login" replace />;
    if (roles && user && !roles.includes(user.role)) return <Navigate to="/403" replace />;
    return children;
  };

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      
      <Route path="/" element={<FrontLayout />}>
        <Route index element={<SpaceList />} />
        <Route path="spaces" element={<SpaceList />} />
        <Route path="spaces/:id" element={<SpaceDetail />} />
        <Route path="my-appointments" element={
          <ProtectedRoute><MyAppointments /></ProtectedRoute>
        } />
        <Route path="my-contracts" element={
          <ProtectedRoute><MyContracts /></ProtectedRoute>
        } />
        <Route path="my-bills" element={
          <ProtectedRoute><MyBills /></ProtectedRoute>
        } />
      </Route>

      <Route path="/admin" element={
        <ProtectedRoute>
          <AdminLayout />
        </ProtectedRoute>
      }>
        <Route index element={<Dashboard />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="appointments" element={<AppointmentList />} />
        <Route path="appointments/:id" element={<AppointmentDetail />} />
        <Route path="noshow" element={
          <ProtectedRoute roles={[UserRole.SuperAdmin, UserRole.LandlordManager, UserRole.ConsultantManager]}>
            <NoShowList />
          </ProtectedRoute>
        } />
        <Route path="spaces" element={
          <ProtectedRoute roles={[UserRole.SuperAdmin, UserRole.ConsultantManager, UserRole.LandlordManager]}>
            <SpaceManage />
          </ProtectedRoute>
        } />
        <Route path="contracts" element={<ContractList />} />
        <Route path="contracts/:id" element={<ContractDetail />} />
        <Route path="bills" element={
          <ProtectedRoute roles={[UserRole.SuperAdmin, UserRole.Finance]}>
            <BillList />
          </ProtectedRoute>
        } />
        <Route path="orders" element={<OrderList />} />
        <Route path="orders/:id" element={<OrderDetail />} />
        <Route path="logs" element={
          <ProtectedRoute roles={[UserRole.SuperAdmin]}>
            <OperationLogs />
          </ProtectedRoute>
        } />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
