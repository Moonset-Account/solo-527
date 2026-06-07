import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "@/components/Layout";
import Dashboard from "@/pages/Dashboard";
import Compare from "@/pages/Compare";
import Visualization from "@/pages/Visualization";
import CampusMap from "@/pages/CampusMap";
import Detail from "@/pages/Detail";
import Notes from "@/pages/Notes";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/compare" element={<Compare />} />
          <Route path="/visualization" element={<Visualization />} />
          <Route path="/campus-map" element={<CampusMap />} />
          <Route path="/detail" element={<Detail />} />
          <Route path="/notes" element={<Notes />} />
        </Route>
      </Routes>
    </Router>
  );
}
