import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import MainLayout from './components/MainLayout';
import Dashboard from './pages/Dashboard';
import Films from './pages/Films';
import Screenings from './pages/Screenings';
import Members from './pages/Members';
import Bookings from './pages/Bookings';
import Guests from './pages/Guests';
import CheckIn from './pages/CheckIn';
import Reports from './pages/Reports';
import ImportExport from './pages/ImportExport';
import Logs from './pages/Logs';
import Settings from './pages/Settings';

function App() {
  const isAuthenticated = !!localStorage.getItem('token');

  return (
    <Router>
      <div className="app-container">
        <Routes>
          <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <Login />} />
          
          <Route path="/" element={isAuthenticated ? <MainLayout /> : <Navigate to="/login" replace />}>
            <Route index element={<Dashboard />} />
            <Route path="films" element={<Films />} />
            <Route path="screenings" element={<Screenings />} />
            <Route path="members" element={<Members />} />
            <Route path="bookings" element={<Bookings />} />
            <Route path="guests" element={<Guests />} />
            <Route path="check-in" element={<CheckIn />} />
            <Route path="reports" element={<Reports />} />
            <Route path="import-export" element={<ImportExport />} />
            <Route path="logs" element={<Logs />} />
            <Route path="settings" element={<Settings />} />
          </Route>
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
