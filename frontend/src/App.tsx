import { Routes, Route } from 'react-router-dom'
import PublicLayout from './layouts/PublicLayout'
import AdminLayout from './layouts/AdminLayout'
import RouteList from './pages/public/RouteList'
import RouteDetail from './pages/public/RouteDetail'
import Dashboard from './pages/admin/Dashboard'
import InventoryManagement from './pages/admin/InventoryManagement'
import InventoryDetailPage from './pages/admin/InventoryDetailPage'
import CleaningTaskPage from './pages/admin/CleaningTaskPage'
import OrderManagement from './pages/admin/OrderManagement'
import RefundManagement from './pages/admin/RefundManagement'
import ConfigManagement from './pages/admin/ConfigManagement'
import ReminderRulePage from './pages/admin/ReminderRulePage'
import ExportLogPage from './pages/admin/ExportLogPage'
import RouteAdmin from './pages/admin/RouteAdmin'

function App() {
  return (
    <Routes>
      <Route path="/" element={<PublicLayout />}>
        <Route index element={<RouteList />} />
        <Route path="route/:id" element={<RouteDetail />} />
      </Route>

      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="routes" element={<RouteAdmin />} />
        <Route path="inventory" element={<InventoryManagement />} />
        <Route path="inventory/:id/detail" element={<InventoryDetailPage />} />
        <Route path="cleaning" element={<CleaningTaskPage />} />
        <Route path="orders" element={<OrderManagement />} />
        <Route path="refunds" element={<RefundManagement />} />
        <Route path="configs" element={<ConfigManagement />} />
        <Route path="reminder-rules" element={<ReminderRulePage />} />
        <Route path="export-logs" element={<ExportLogPage />} />
      </Route>
    </Routes>
  )
}

export default App
