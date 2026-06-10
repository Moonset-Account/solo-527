import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ConfigProvider, App as AntApp } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import PortalLayout from '@/layouts/PortalLayout';
import AdminLayout from '@/layouts/AdminLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import Login from '@/pages/Login';
import Home from '@/pages/portal/Home';
import Booking from '@/pages/portal/Booking';
import BookingConfirm from '@/pages/portal/BookingConfirm';
import About from '@/pages/portal/About';
import Dashboard from '@/pages/admin/Dashboard';
import InventoryManagement from '@/pages/admin/InventoryManagement';
import OrderManagement from '@/pages/admin/OrderManagement';
import OrderDetail from '@/pages/admin/OrderDetail';
import ConversionFunnel from '@/pages/admin/ConversionFunnel';
import ReminderList from '@/pages/admin/ReminderList';
import ReminderRules from '@/pages/admin/ReminderRules';
import TourRoutes from '@/pages/admin/TourRoutes';
import CleaningTasks from '@/pages/admin/CleaningTasks';
import ItineraryVersions from '@/pages/admin/ItineraryVersions';
import AuditLogs from '@/pages/admin/AuditLogs';
import NotFound from '@/pages/NotFound';

export default function App() {
  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        token: {
          colorPrimary: '#16a34a',
          colorLink: '#16a34a',
          colorLinkHover: '#15803d',
          borderRadius: 8,
          fontFamily: '"PingFang SC", "Microsoft YaHei", system-ui, -apple-system, sans-serif',
        },
      }}
    >
      <AntApp>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />

            <Route path="/" element={<PortalLayout />}>
              <Route index element={<Home />} />
              <Route path="booking" element={<Booking />} />
              <Route path="booking/confirm" element={<BookingConfirm />} />
              <Route path="about" element={<About />} />
            </Route>

            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="inventory" element={<InventoryManagement />} />
              <Route path="orders" element={<OrderManagement />} />
              <Route path="orders/:id" element={<OrderDetail />} />
              <Route path="orders/conversion" element={<ConversionFunnel />} />
              <Route path="reminders" element={<ReminderList />} />
              <Route path="reminders/rules" element={<ReminderRules />} />
              <Route path="configuration/tour-routes" element={<TourRoutes />} />
              <Route path="configuration/cleaning-tasks" element={<CleaningTasks />} />
              <Route path="configuration/itinerary-versions" element={<ItineraryVersions />} />
              <Route path="audit" element={<AuditLogs />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AntApp>
    </ConfigProvider>
  );
}
