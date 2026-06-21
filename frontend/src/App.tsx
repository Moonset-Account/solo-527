import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import EquipmentPage from './pages/Equipment';
import ProcessStep from './pages/ProcessStep';
import WorkReport from './pages/WorkReport';
import Statistics from './pages/Statistics';
import Review from './pages/Review';
import WorkOrders from './pages/WorkOrders';

function App() {
  const { isAuthenticated } = useAuthStore();

  return (
    <Router>
      <Routes>
        <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/" />} />
        <Route
          path="/"
          element={isAuthenticated ? <Layout /> : <Navigate to="/login" />}
        >
          <Route index element={<Dashboard />} />
          <Route path="equipment" element={<EquipmentPage />} />
          <Route path="process" element={<ProcessStep />} />
          <Route path="workreport" element={<WorkReport />} />
          <Route path="workorders" element={<WorkOrders />} />
          <Route path="statistics" element={<Statistics />} />
          <Route path="review" element={<Review />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
