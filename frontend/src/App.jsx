import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import ExternalSubmit from './pages/ExternalSubmit'
import Layout from './components/Layout'
import ArtworkList from './pages/ArtworkList'
import KilnRunList from './pages/KilnRunList'
import KilnRunDetail from './pages/KilnRunDetail'
import FiringCurveList from './pages/FiringCurveList'
import KilnOutRecordList from './pages/KilnOutRecordList'
import DamageClaimList from './pages/DamageClaimList'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/external/submit" element={<ExternalSubmit />} />
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="/artworks" replace />} />
        <Route path="artworks" element={<ArtworkList />} />
        <Route path="kiln-runs" element={<KilnRunList />} />
        <Route path="kiln-runs/:id" element={<KilnRunDetail />} />
        <Route path="firing-curves" element={<FiringCurveList />} />
        <Route path="kiln-out-records" element={<KilnOutRecordList />} />
        <Route path="damage-claims" element={<DamageClaimList />} />
      </Route>
    </Routes>
  )
}

export default App
