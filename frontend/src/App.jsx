
import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import MainLayout from './layouts/MainLayout'
import Dashboard from './pages/Dashboard'
import AppointmentBooking from './pages/AppointmentBooking'
import TodoList from './pages/TodoList'
import FollowUpManagement from './pages/FollowUpManagement'
import WorkloadReports from './pages/WorkloadReports'
import RecheckLostStats from './pages/RecheckLostStats'
import ExternalApiLogs from './pages/ExternalApiLogs'
import PatientList from './pages/PatientList'
import DoctorList from './pages/DoctorList'
import ScheduleUtilization from './pages/ScheduleUtilization'

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/" element={<MainLayout />}>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="appointment-booking" element={<AppointmentBooking />} />
          <Route path="todos" element={<TodoList />} />
          <Route path="follow-ups" element={<FollowUpManagement />} />
          <Route path="workload-report" element={<WorkloadReports />} />
          <Route path="statistics" element={<RecheckLostStats />} />
          <Route path="api-monitor" element={<ExternalApiLogs />} />
          <Route path="patients" element={<PatientList />} />
          <Route path="doctors" element={<DoctorList />} />
          <Route path="schedules" element={<ScheduleUtilization />} />
        </Route>
      </Routes>
    </Router>
  )
}

export default App
