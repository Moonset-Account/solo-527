import { Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from './store/authStore';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import BookingPage from './pages/BookingPage';
import PaymentPage from './pages/PaymentPage';
import PackagePage from './pages/PackagePage';
import BenefitPage from './pages/BenefitPage';
import ServicePage from './pages/ServicePage';
import TestDrivePage from './pages/TestDrivePage';
import ConversionPage from './pages/ConversionPage';
import ReportPage from './pages/ReportPage';
import CashierPage from './pages/CashierPage';
import AlertPage from './pages/AlertPage';

const ProtectedRoute = ({ children }) => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

const App = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="bookings" element={<BookingPage />} />
        <Route path="payments" element={<PaymentPage />} />
        <Route path="membership/packages" element={<PackagePage />} />
        <Route path="membership/benefits" element={<BenefitPage />} />
        <Route path="services" element={<ServicePage />} />
        <Route path="test-drives" element={<TestDrivePage />} />
        <Route path="conversion" element={<ConversionPage />} />
        <Route path="reports" element={<ReportPage />} />
        <Route path="cashier" element={<CashierPage />} />
        <Route path="alerts" element={<AlertPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
