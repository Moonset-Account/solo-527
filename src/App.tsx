import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from '@/components/Layout';
import Dashboard from '@/pages/Dashboard';
import RoomList from '@/pages/RoomList';
import RoomDetail from '@/pages/RoomDetail';
import AppointmentList from '@/pages/AppointmentList';
import AppointmentCalendar from '@/pages/AppointmentCalendar';
import WorkOrderList from '@/pages/WorkOrderList';
import ContractList from '@/pages/ContractList';
import ContractDetail from '@/pages/ContractDetail';
import ContractTemplates from '@/pages/ContractTemplates';
import SettlementList from '@/pages/SettlementList';
import SettlementDetail from '@/pages/SettlementDetail';
import ExceptionList from '@/pages/ExceptionList';
import ExceptionDetail from '@/pages/ExceptionDetail';
import MessageList from '@/pages/MessageList';
import PaymentList from '@/pages/PaymentList';
import Settings from '@/pages/Settings';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/rooms" element={<RoomList />} />
          <Route path="/rooms/:id" element={<RoomDetail />} />
          <Route path="/appointments" element={<AppointmentList />} />
          <Route path="/appointments/calendar" element={<AppointmentCalendar />} />
          <Route path="/work-orders" element={<WorkOrderList />} />
          <Route path="/contracts" element={<ContractList />} />
          <Route path="/contracts/:id" element={<ContractDetail />} />
          <Route path="/contracts/templates" element={<ContractTemplates />} />
          <Route path="/settlements" element={<SettlementList />} />
          <Route path="/settlements/:id" element={<SettlementDetail />} />
          <Route path="/exceptions" element={<ExceptionList />} />
          <Route path="/exceptions/:id" element={<ExceptionDetail />} />
          <Route path="/messages" element={<MessageList />} />
          <Route path="/payments" element={<PaymentList />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
