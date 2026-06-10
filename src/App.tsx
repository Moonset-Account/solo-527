import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import BookingPage from "@/pages/BookingPage";
import PaymentPage from "@/pages/PaymentPage";
import OrderTrackPage from "@/pages/OrderTrackPage";
import DashboardPage from "@/pages/DashboardPage";
import DispatchPage from "@/pages/DispatchPage";
import VehicleListPage from "@/pages/VehicleListPage";
import VehicleDetailPage from "@/pages/VehicleDetailPage";
import CashierPage from "@/pages/CashierPage";
import PartsShortagePage from "@/pages/PartsShortagePage";
import ReportsPage from "@/pages/ReportsPage";
import AuditLogsPage from "@/pages/AuditLogsPage";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<BookingPage />} />
        <Route path="/booking" element={<BookingPage />} />
        <Route path="/booking/pay/:id" element={<PaymentPage />} />
        <Route path="/booking/order/:id" element={<OrderTrackPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/dispatch" element={<DispatchPage />} />
        <Route path="/vehicles" element={<VehicleListPage />} />
        <Route path="/vehicles/:id" element={<VehicleDetailPage />} />
        <Route path="/cashier" element={<CashierPage />} />
        <Route path="/parts-shortage" element={<PartsShortagePage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/audit-logs" element={<AuditLogsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
