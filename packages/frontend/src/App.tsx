import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuthStore } from './store/authStore';
import Login from './pages/Login';
import MainLayout from './components/Layout/MainLayout';
import RequirementList from './pages/requirement/List';
import RequirementDetail from './pages/requirement/Detail';
import RequirementForm from './pages/requirement/Form';
import QuoteList from './pages/quote/List';
import QuoteDetail from './pages/quote/Detail';
import QuoteForm from './pages/quote/Form';
import QuoteCompare from './pages/quote/Compare';
import ContractList from './pages/contract/List';
import ContractDetail from './pages/contract/Detail';
import ProfitDashboard from './pages/profit/Dashboard';
import NotificationList from './pages/notification/List';

function App() {
  const { isAuthenticated, loadProfile, token } = useAuthStore();

  useEffect(() => {
    if (token && isAuthenticated) {
      loadProfile();
    }
  }, [token]);

  return (
    <Routes>
      <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/" />} />
      <Route
        path="/*"
        element={
          isAuthenticated ? (
            <MainLayout>
              <Routes>
                <Route path="/" element={<Navigate to="/requirements" />} />
                <Route path="/requirements" element={<RequirementList />} />
                <Route path="/requirements/new" element={<RequirementForm />} />
                <Route path="/requirements/:id" element={<RequirementDetail />} />
                <Route path="/requirements/:id/edit" element={<RequirementForm />} />
                <Route path="/quotes" element={<QuoteList />} />
                <Route path="/quotes/new" element={<QuoteForm />} />
                <Route path="/quotes/:id" element={<QuoteDetail />} />
                <Route path="/quotes/:id/edit" element={<QuoteForm />} />
                <Route path="/quotes/:id/compare" element={<QuoteCompare />} />
                <Route path="/contracts" element={<ContractList />} />
                <Route path="/contracts/:id" element={<ContractDetail />} />
                <Route path="/profit" element={<ProfitDashboard />} />
                <Route path="/notifications" element={<NotificationList />} />
              </Routes>
            </MainLayout>
          ) : (
            <Navigate to="/login" />
          )
        }
      />
    </Routes>
  );
}

export default App;
