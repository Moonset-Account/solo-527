import { Routes, Route, Navigate } from 'react-router-dom'
import MainLayout from '@/layouts/MainLayout'
import Dashboard from '@/pages/Dashboard'
import SessionList from '@/pages/SessionList'
import SessionDetail from '@/pages/SessionDetail'
import InspectionList from '@/pages/InspectionList'
import InspectionDetail from '@/pages/InspectionDetail'
import InspectionEdit from '@/pages/InspectionEdit'
import TicketList from '@/pages/TicketList'
import TicketDetail from '@/pages/TicketDetail'
import KnowledgeBase from '@/pages/KnowledgeBase'
import KnowledgeDetail from '@/pages/KnowledgeDetail'
import ResponseTimeAnalysis from '@/pages/ResponseTimeAnalysis'

function App() {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="sessions" element={<SessionList />} />
        <Route path="sessions/:id" element={<SessionDetail />} />
        <Route path="inspections" element={<InspectionList />} />
        <Route path="inspections/:id" element={<InspectionDetail />} />
        <Route path="inspections/new/:sessionId" element={<InspectionEdit />} />
        <Route path="inspections/edit/:id" element={<InspectionEdit />} />
        <Route path="tickets" element={<TicketList />} />
        <Route path="tickets/:id" element={<TicketDetail />} />
        <Route path="knowledge" element={<KnowledgeBase />} />
        <Route path="knowledge/:id" element={<KnowledgeDetail />} />
        <Route path="response-time" element={<ResponseTimeAnalysis />} />
      </Route>
    </Routes>
  )
}

export default App
