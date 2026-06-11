import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { authApi } from './api/auth';
import Login from './pages/Login';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';
import ResumeSubmit from './pages/ResumeSubmit';
import ResumeProgress from './pages/ResumeProgress';
import ResumeList from './pages/ResumeList';
import ResumeDetail from './pages/ResumeDetail';
import QuestionBank from './pages/QuestionBank';
import QuestionManage from './pages/QuestionManage';
import ScoringCriteria from './pages/ScoringCriteria';
import InterviewList from './pages/InterviewList';
import InterviewSchedule from './pages/InterviewSchedule';
import NotificationCenter from './pages/NotificationCenter';
import RecruitmentCycles from './pages/RecruitmentCycles';
import ProcessingRecords from './pages/ProcessingRecords';
import UserManage from './pages/UserManage';
import InterviewQuality from './pages/InterviewQuality';
import AbilityProfile from './pages/AbilityProfile';

const App: React.FC = () => {
  const { isAuthenticated, setUser } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      authApi.getProfile()
        .then((res: any) => {
          if (res.success) {
            setUser(res.data);
          }
        })
        .catch(() => {});
    }
  }, [isAuthenticated, setUser]);

  return (
    <Router>
      <Routes>
        <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/dashboard" />} />
        
        <Route path="/" element={isAuthenticated ? <MainLayout /> : <Navigate to="/login" />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          
          <Route path="resume/submit" element={<ResumeSubmit />} />
          <Route path="resume/progress" element={<ResumeProgress />} />
          <Route path="resumes" element={<ResumeList />} />
          <Route path="resumes/:id" element={<ResumeDetail />} />
          
          <Route path="questions" element={<QuestionManage />} />
          <Route path="question-banks" element={<QuestionBank />} />
          
          <Route path="scoring-criteria" element={<ScoringCriteria />} />
          
          <Route path="interviews" element={<InterviewList />} />
          <Route path="interview-schedule" element={<InterviewSchedule />} />
          <Route path="interview-quality" element={<InterviewQuality />} />
          
          <Route path="notifications" element={<NotificationCenter />} />
          
          <Route path="recruitment-cycles" element={<RecruitmentCycles />} />
          <Route path="processing-records" element={<ProcessingRecords />} />
          
          <Route path="ability-profile/:resumeId" element={<AbilityProfile />} />
          
          <Route path="users" element={<UserManage />} />
        </Route>
        
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
};

export default App;
