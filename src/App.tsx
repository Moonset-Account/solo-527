import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import MainLayout from "@/components/layout/MainLayout";
import Dashboard from "@/pages/Dashboard";
import Temperature from "@/pages/Temperature";
import RouteReplay from "@/pages/RouteReplay";
import Exception from "@/pages/Exception";
import Compare from "@/pages/Compare";
import DataQuality from "@/pages/DataQuality";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/temperature" element={<Temperature />} />
          <Route path="/route" element={<RouteReplay />} />
          <Route path="/exception" element={<Exception />} />
          <Route path="/compare" element={<Compare />} />
          <Route path="/data-quality" element={<DataQuality />} />
        </Route>
      </Routes>
    </Router>
  );
}
