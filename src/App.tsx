import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import Layout from "@/components/Layout"
import Dashboard from "@/pages/Dashboard"
import Analysis from "@/pages/Analysis"
import SpareParts from "@/pages/SpareParts"
import Pipeline from "@/pages/Pipeline"

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/analysis" element={<Analysis />} />
          <Route path="/spare-parts" element={<SpareParts />} />
          <Route path="/pipeline" element={<Pipeline />} />
        </Route>
      </Routes>
    </Router>
  )
}
