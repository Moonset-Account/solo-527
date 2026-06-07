import React from 'react';
import { Routes, Route } from 'react-router-dom';
import MainLayout from './components/Layout/MainLayout';
import Dashboard from './pages/Dashboard';
import BookDetail from './pages/BookDetail';
import PricingHistory from './pages/PricingHistory';

function App() {
  return (
    <MainLayout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/book/:isbn" element={<BookDetail />} />
        <Route path="/pricing-history" element={<PricingHistory />} />
      </Routes>
    </MainLayout>
  );
}

export default App;
