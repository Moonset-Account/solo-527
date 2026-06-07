import { Routes, Route } from 'react-router-dom';
import WorkbenchPage from './pages/WorkbenchPage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<WorkbenchPage />} />
    </Routes>
  );
}

export default App;
