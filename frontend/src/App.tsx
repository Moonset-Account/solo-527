import { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import Login from './pages/Login';
import Register from './pages/Register';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';
import MentorList from './pages/MentorList';
import MentorDetail from './pages/MentorDetail';
import AppointmentList from './pages/AppointmentList';
import AppointmentDetail from './pages/AppointmentDetail';
import CreateAppointment from './pages/CreateAppointment';
import Profile from './pages/Profile';
import Notifications from './pages/Notifications';
import AdminReview from './pages/AdminReview';

function App() {
  const { accessToken, fetchProfile, user } = useAuthStore();
  const [isInitialized, setIsInitialized] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (accessToken && !user) {
      fetchProfile().finally(() => setIsInitialized(true));
    } else {
      setIsInitialized(true);
    }
  }, [accessToken]);

  useEffect(() => {
    if (isInitialized && !accessToken && !['/login', '/register'].includes(location.pathname)) {
      navigate('/login');
    }
  }, [accessToken, isInitialized, location.pathname]);

  if (!isInitialized) {
    return <div className="flex items-center justify-center h-screen">加载中...</div>;
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/" element={accessToken ? <MainLayout /> : <Navigate to="/login" />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="mentors" element={<MentorList />} />
        <Route path="mentors/:id" element={<MentorDetail />} />
        <Route path="appointments" element={<AppointmentList />} />
        <Route path="appointments/:id" element={<AppointmentDetail />} />
        <Route path="appointments/create" element={<CreateAppointment />} />
        <Route path="profile" element={<Profile />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="admin/review" element={<AdminReview />} />
      </Route>
    </Routes>
  );
}

export default App;
