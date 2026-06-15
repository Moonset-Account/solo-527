import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import LeadList from './pages/leads/LeadList';
import LeadDetail from './pages/leads/LeadDetail';
import LeadCreate from './pages/leads/LeadCreate';
import PublicSea from './pages/leads/PublicSea';
import ConsultationList from './pages/consultations/ConsultationList';
import ConsultationDetail from './pages/consultations/ConsultationDetail';
import ConsultationCreate from './pages/consultations/ConsultationCreate';
import ContractList from './pages/contracts/ContractList';
import ContractDetail from './pages/contracts/ContractDetail';
import ContractCreate from './pages/contracts/ContractCreate';
import ContractApproval from './pages/contracts/ContractApproval';
import Reports from './pages/reports/Reports';
import OperationLogs from './pages/common/OperationLogs';
import SystemSettings from './pages/settings/SystemSettings';

const PrivateRoute = ({ children }) => {
  const { isAuthenticated } = useSelector(state => state.auth);
  return isAuthenticated ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <div className="app-container">
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="leads" element={<LeadList />} />
          <Route path="leads/create" element={<LeadCreate />} />
          <Route path="leads/:id" element={<LeadDetail />} />
          <Route path="public-sea" element={<PublicSea />} />
          <Route path="consultations" element={<ConsultationList />} />
          <Route path="consultations/create" element={<ConsultationCreate />} />
          <Route path="consultations/:id" element={<ConsultationDetail />} />
          <Route path="contracts" element={<ContractList />} />
          <Route path="contracts/create" element={<ContractCreate />} />
          <Route path="contracts/:id" element={<ContractDetail />} />
          <Route path="contract-approval" element={<ContractApproval />} />
          <Route path="reports" element={<Reports />} />
          <Route path="operation-logs" element={<OperationLogs />} />
          <Route path="settings" element={<SystemSettings />} />
        </Route>
      </Routes>
    </div>
  );
}

export default App;
