import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "@/components/Layout";
import Overview from "@/pages/Overview";
import SKURanking from "@/pages/SKURanking";
import Logistics from "@/pages/Logistics";
import Quality from "@/pages/Quality";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Overview />} />
          <Route path="/sku" element={<SKURanking />} />
          <Route path="/logistics" element={<Logistics />} />
          <Route path="/quality" element={<Quality />} />
        </Route>
      </Routes>
    </Router>
  );
}
