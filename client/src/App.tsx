
import { Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';
import OrderList from './pages/OrderList';
import OrderCreate from './pages/OrderCreate';
import OrderDetail from './pages/OrderDetail';
import StoreSummary from './pages/StoreSummary';
import DeliveryReminders from './pages/DeliveryReminders';
import EquipmentList from './pages/EquipmentList';
import BatchOperations from './pages/BatchOperations';

function App() {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="orders" element={<OrderList />} />
        <Route path="orders/create" element={<OrderCreate />} />
        <Route path="orders/:id" element={<OrderDetail />} />
        <Route path="store-summary" element={<StoreSummary />} />
        <Route path="delivery-reminders" element={<DeliveryReminders />} />
        <Route path="equipment" element={<EquipmentList />} />
        <Route path="batch-operations" element={<BatchOperations />} />
      </Route>
    </Routes>
  );
}

export default App;
