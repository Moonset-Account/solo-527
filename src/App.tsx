import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "@/components/Layout";
import Dashboard from "@/pages/Dashboard";
import ReasonDrilldown from "@/pages/ReasonDrilldown";
import CycleAnalysis from "@/pages/CycleAnalysis";
import ProductRankingPage from "@/pages/ProductRankingPage";
import ExportManager from "@/pages/ExportManager";
import DataManagement from "@/pages/DataManagement";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/drilldown/reason" element={<ReasonDrilldown />} />
          <Route path="/drilldown/cycle" element={<CycleAnalysis />} />
          <Route path="/drilldown/product" element={<ProductRankingPage />} />
          <Route path="/exports" element={<ExportManager />} />
          <Route path="/data-management" element={<DataManagement />} />
        </Route>
      </Routes>
    </Router>
  );
}
