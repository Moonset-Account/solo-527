import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from '../components/Layout/MainLayout';

import Dashboard from '../pages/Dashboard/index';
import BatchList from '../pages/Batches/index';
import BatchDetail from '../pages/Batches/Detail';
import Environment from '../pages/Environment/index';
import Materials from '../pages/Materials/index';
import Orders from '../pages/Orders/index';
import Operations from '../pages/Operations/index';
import Plots from '../pages/Plots/index';
import Thresholds from '../pages/Thresholds/index';
import Users from '../pages/Users/index';

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} index />
        <Route path="/batches" element={<BatchList />} />
        <Route path="/batches/:id" element={<BatchDetail />} />
        <Route path="/environment" element={<Environment />} />
        <Route path="/materials" element={<Materials />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/operations" element={<Operations />} />
        <Route path="/plots" element={<Plots />} />
        <Route path="/thresholds" element={<Thresholds />} />
        <Route path="/users" element={<Users />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  );
};

export default AppRoutes;
