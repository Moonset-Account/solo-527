import React from 'react'
import { Routes, Route } from 'react-router-dom'
import MainLayout from './components/MainLayout'
import ReceptionPage from './pages/ReceptionPage'
import SchedulePage from './pages/SchedulePage'
import AppointmentListPage from './pages/AppointmentListPage'
import PatientListPage from './pages/PatientListPage'
import StatsPage from './pages/StatsPage'
import ConflictPage from './pages/ConflictPage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<ReceptionPage />} />
        <Route path="reception" element={<ReceptionPage />} />
        <Route path="appointments" element={<AppointmentListPage />} />
        <Route path="patients" element={<PatientListPage />} />
        <Route path="schedule" element={<SchedulePage />} />
        <Route path="conflicts" element={<ConflictPage />} />
        <Route path="stats" element={<StatsPage />} />
      </Route>
    </Routes>
  )
}

export default App
