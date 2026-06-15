import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from '@/components/Layout';
import Dashboard from '@/pages/Dashboard';
import Scheduling from '@/pages/Scheduling';
import Appointments from '@/pages/Appointments';
import Review from '@/pages/Review';
import Export from '@/pages/Export';
import AuditLog from '@/pages/AuditLog';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/scheduling" element={<Scheduling />} />
          <Route path="/appointments" element={<Appointments />} />
          <Route path="/review" element={<Review />} />
          <Route path="/export" element={<Export />} />
          <Route path="/audit-log" element={<AuditLog />} />
        </Route>
      </Routes>
    </Router>
  );
}
