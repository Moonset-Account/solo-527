import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from './store/authStore';
import Login from './pages/Login';
import MainLayout from './components/Layout/MainLayout';
import Dashboard from './pages/Dashboard';
import ResidentList from './pages/residents/ResidentList';
import ResidentDetail from './pages/residents/ResidentDetail';
import TopicList from './pages/topics/TopicList';
import TopicDetail from './pages/topics/TopicDetail';
import VotingPage from './pages/voting/VotingPage';
import PatrolTaskList from './pages/patrol/PatrolTaskList';
import AssistanceDemandList from './pages/assistance/AssistanceDemandList';
import TaskKanban from './pages/tasks/TaskKanban';
import VolunteerRoute from './pages/volunteers/VolunteerRoute';
import NotFound from './pages/NotFound';

const ProtectedRoute = ({ children, requiredRoles }) => {
  const { isAuthenticated, hasRole, checkAuth } = useAuthStore();
  
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (requiredRoles && !hasRole(requiredRoles)) {
    return <Navigate to="/403" replace />;
  }
  
  return children;
};

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={
        <ProtectedRoute>
          <MainLayout />
        </ProtectedRoute>
      }>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="residents" element={<ResidentList />} />
        <Route path="residents/:id" element={<ResidentDetail />} />
        <Route path="topics" element={<TopicList />} />
        <Route path="topics/:id" element={<TopicDetail />} />
        <Route path="voting" element={<VotingPage />} />
        <Route path="patrol" element={<PatrolTaskList />} />
        <Route path="assistance" element={<AssistanceDemandList />} />
        <Route path="tasks" element={<TaskKanban />} />
        <Route path="volunteers" element={<VolunteerRoute />} />
      </Route>
      <Route path="/403" element={<NotFound code="403" message="无权限访问" />} />
      <Route path="/404" element={<NotFound />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;
