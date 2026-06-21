import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import AppointmentPage from './pages/AppointmentPage';
import CheckInPage from './pages/CheckInPage';
import AdminPage from './pages/AdminPage';
import StatisticsPage from './pages/StatisticsPage';
import RefundPage from './pages/RefundPage';
import ReminderPage from './pages/ReminderPage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Navigate to="/appointment" replace />} />
        <Route path="appointment" element={<AppointmentPage />} />
        <Route path="checkin" element={<CheckInPage />} />
        <Route path="admin" element={<AdminPage />} />
        <Route path="statistics" element={<StatisticsPage />} />
        <Route path="refund" element={<RefundPage />} />
        <Route path="reminders" element={<ReminderPage />} />
      </Route>
    </Routes>
  );
}

export default App;
