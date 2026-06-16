import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import PurchaseList from './pages/purchase/List.jsx';
import PurchaseDetail from './pages/purchase/Detail.jsx';
import InboundList from './pages/inbound/List.jsx';
import InboundDetail from './pages/inbound/Detail.jsx';
import InboundScan from './pages/inbound/Scan.jsx';
import OutboundList from './pages/outbound/List.jsx';
import OutboundDetail from './pages/outbound/Detail.jsx';
import OutboundScan from './pages/outbound/Scan.jsx';

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/purchase" replace />} />

      <Route path="/purchase" element={<PurchaseList />} />
      <Route path="/purchase/new" element={<PurchaseList />} />
      <Route path="/purchase/:id" element={<PurchaseDetail />} />
      <Route path="/purchase/:id/edit" element={<PurchaseDetail />} />

      <Route path="/inbound" element={<InboundList />} />
      <Route path="/inbound/new" element={<InboundScan />} />
      <Route path="/inbound/scan" element={<InboundScan />} />
      <Route path="/inbound/:id" element={<InboundDetail />} />

      <Route path="/outbound" element={<OutboundList />} />
      <Route path="/outbound/new" element={<OutboundScan />} />
      <Route path="/outbound/scan" element={<OutboundScan />} />
      <Route path="/outbound/:id" element={<OutboundDetail />} />

      <Route path="*" element={<Navigate to="/purchase" replace />} />
    </Routes>
  );
};

export default App;
