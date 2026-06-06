import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Overview from './pages/Overview';
import Stations from './pages/Stations';
import RoutesPage from './pages/Routes';
import Dispatch from './pages/Dispatch';
import Forecast from './pages/Forecast';
import DataManagement from './pages/DataManagement';

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Overview />} />
        <Route path="/stations" element={<Stations />} />
        <Route path="/routes" element={<RoutesPage />} />
        <Route path="/dispatch" element={<Dispatch />} />
        <Route path="/forecast" element={<Forecast />} />
        <Route path="/data" element={<DataManagement />} />
      </Routes>
    </Layout>
  );
}

export default App;
