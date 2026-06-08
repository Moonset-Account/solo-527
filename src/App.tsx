import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Layout from '@/components/Layout'
import Dashboard from '@/pages/Dashboard'
import ThemeTrends from '@/pages/ThemeTrends'
import BranchCompare from '@/pages/BranchCompare'
import ReservationWait from '@/pages/ReservationWait'
import OverdueHeatmap from '@/pages/OverdueHeatmap'
import WeeklyReports from '@/pages/WeeklyReports'

export default function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/theme-trends" element={<ThemeTrends />} />
          <Route path="/branch-compare" element={<BranchCompare />} />
          <Route path="/reservation-wait" element={<ReservationWait />} />
          <Route path="/overdue-heatmap" element={<OverdueHeatmap />} />
          <Route path="/weekly-reports" element={<WeeklyReports />} />
        </Routes>
      </Layout>
    </Router>
  )
}
