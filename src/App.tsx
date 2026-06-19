import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "@/components/Layout";
import Dashboard from "@/pages/Dashboard";
import ContractDetail from "@/pages/ContractDetail";
import Materials from "@/pages/Materials";
import Statistics from "@/pages/Statistics";
import MobileProgress from "@/pages/MobileProgress";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/contract/:id" element={<ContractDetail />} />
          <Route path="/materials" element={<Materials />} />
          <Route path="/statistics" element={<Statistics />} />
        </Route>
        <Route path="/m/progress/:contractNo" element={<MobileProgress />} />
      </Routes>
    </Router>
  );
}
