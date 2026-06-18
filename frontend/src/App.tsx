import { Routes, Route } from 'react-router-dom'
import { Layout } from 'antd'
import MainLayout from '@/layouts/MainLayout'
import Dashboard from '@/pages/Dashboard'
import TemplateList from '@/pages/TemplateList'
import TaskList from '@/pages/TaskList'
import RecordList from '@/pages/RecordList'
import RiskSampleList from '@/pages/RiskSampleList'
import CallLogList from '@/pages/CallLogList'
import StatsPage from '@/pages/StatsPage'

const { Content } = Layout

function App() {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="templates" element={<TemplateList />} />
        <Route path="tasks" element={<TaskList />} />
        <Route path="records" element={<RecordList />} />
        <Route path="risk-samples" element={<RiskSampleList />} />
        <Route path="call-logs" element={<CallLogList />} />
        <Route path="stats" element={<StatsPage />} />
      </Route>
    </Routes>
  )
}

export default App
