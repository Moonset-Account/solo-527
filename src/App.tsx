import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from '@/components/Layout';
import Dashboard from '@/pages/Dashboard';
import RepairSubmit from '@/pages/RepairSubmit';
import RepairTrack from '@/pages/RepairTrack';
import ReviewList from '@/pages/ReviewList';
import ReviewDetail from '@/pages/ReviewDetail';
import QuotaManagement from '@/pages/QuotaManagement';
import CheckinManagement from '@/pages/CheckinManagement';
import FlowRecordDetail from '@/pages/FlowRecordDetail';
import DetailsExport from '@/pages/DetailsExport';
import BatchProcess from '@/pages/BatchProcess';
import Login from '@/pages/Login';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/*"
          element={
            <Layout>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/repair/submit" element={<RepairSubmit />} />
                <Route path="/repair/track/:id" element={<RepairTrack />} />
                <Route path="/review" element={<ReviewList />} />
                <Route path="/review/:id" element={<ReviewDetail />} />
                <Route path="/quota" element={<QuotaManagement />} />
                <Route path="/checkin" element={<CheckinManagement />} />
                <Route path="/flow/:id" element={<FlowRecordDetail />} />
                <Route path="/details" element={<DetailsExport />} />
                <Route path="/batch" element={<BatchProcess />} />
              </Routes>
            </Layout>
          }
        />
      </Routes>
    </Router>
  );
}
