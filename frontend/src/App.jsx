import { Routes, Route, Navigate } from 'react-router-dom'
import { useUserStore } from './store/userStore'
import MainLayout from './components/MainLayout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import LeadList from './pages/LeadList'
import LeadDetail from './pages/LeadDetail'
import LeadCreate from './pages/LeadCreate'
import PublicSea from './pages/PublicSea'
import ExceptionList from './pages/ExceptionList'
import TagManage from './pages/admin/TagManage'
import LostReasonManage from './pages/admin/LostReasonManage'
import PublicSeaRuleManage from './pages/admin/PublicSeaRuleManage'
import UserManage from './pages/admin/UserManage'

function App() {
  const token = useUserStore((state) => state.token)

  if (!token) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    )
  }

  return (
    <Routes>
      <Route path="/login" element={<Navigate to="/" replace />} />
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="leads" element={<LeadList />} />
        <Route path="leads/create" element={<LeadCreate />} />
        <Route path="leads/:id" element={<LeadDetail />} />
        <Route path="public-sea" element={<PublicSea />} />
        <Route path="exceptions" element={<ExceptionList />} />
        <Route path="admin/tags" element={<TagManage />} />
        <Route path="admin/lost-reasons" element={<LostReasonManage />} />
        <Route path="admin/public-sea-rules" element={<PublicSeaRuleManage />} />
        <Route path="admin/users" element={<UserManage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
