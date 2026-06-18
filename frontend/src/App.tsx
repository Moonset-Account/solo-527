import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Layout } from 'antd';
import LoginPage from './pages/login';
import CustomerPage from './pages/customer';
import AdminPage from './pages/admin';
import ManagerPage from './pages/manager';
import { useAuthStore } from './store/useAuthStore';
import { UserRole } from './types';

const { Content } = Layout;

const getHomePageByRole = (role: UserRole): string => {
  switch (role) {
    case UserRole.ADMIN:
    case UserRole.STAFF:
      return '/admin/appointments';
    case UserRole.MANAGER:
      return '/manager/dashboard';
    case UserRole.VOLUNTEER:
      return '/manager/foster-records';
    case UserRole.CUSTOMER:
      return '/customer/appointments';
    default:
      return '/login';
  }
};

const RequireAuth = ({ children }: { children: JSX.Element }) => {
  const { isAuthenticated } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated()) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

const RedirectIfAuthenticated = ({ children }: { children: JSX.Element }) => {
  const { isAuthenticated, user } = useAuthStore();
  const location = useLocation();

  if (isAuthenticated() && user) {
    const from = (location.state as any)?.from?.pathname;
    if (from && from !== '/login') {
      return <Navigate to={from} replace />;
    }
    return <Navigate to={getHomePageByRole(user.role)} replace />;
  }

  return children;
};

const RootRedirect = () => {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated() || !user) {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to={getHomePageByRole(user.role)} replace />;
};

function App() {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Content>
        <Routes>
          <Route path="/" element={<RootRedirect />} />
          <Route
            path="/login"
            element={
              <RedirectIfAuthenticated>
                <LoginPage />
              </RedirectIfAuthenticated>
            }
          />
          <Route
            path="/customer/*"
            element={
              <RequireAuth>
                <CustomerPage />
              </RequireAuth>
            }
          />
          <Route
            path="/admin/*"
            element={
              <RequireAuth>
                <AdminPage />
              </RequireAuth>
            }
          />
          <Route
            path="/manager/*"
            element={
              <RequireAuth>
                <ManagerPage />
              </RequireAuth>
            }
          />
        </Routes>
      </Content>
    </Layout>
  );
}

export default App;
