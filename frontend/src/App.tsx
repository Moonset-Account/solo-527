import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Login } from "@/pages/Login";
import { Dashboard } from "@/pages/Dashboard";
import { DemandList } from "@/pages/DemandList";
import { DemandForm } from "@/pages/DemandForm";
import { QuoteList } from "@/pages/QuoteList";
import { QuoteForm } from "@/pages/QuoteForm";
import { QuoteDetail } from "@/pages/QuoteDetail";
import { ContractList } from "@/pages/ContractList";
import { SupplierList } from "@/pages/SupplierList";
import { ProfitReportPage } from "@/pages/ProfitReport";
import { useAuthStore } from "@/stores/auth";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/demands"
          element={
            <ProtectedRoute>
              <DemandList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/demands/new"
          element={
            <ProtectedRoute>
              <DemandForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/demands/:id"
          element={
            <ProtectedRoute>
              <DemandForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/quotes"
          element={
            <ProtectedRoute>
              <QuoteList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/quotes/new"
          element={
            <ProtectedRoute>
              <QuoteForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/quotes/:id"
          element={
            <ProtectedRoute>
              <QuoteDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/quotes/:id/edit"
          element={
            <ProtectedRoute>
              <QuoteForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/contracts"
          element={
            <ProtectedRoute>
              <ContractList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/suppliers"
          element={
            <ProtectedRoute>
              <SupplierList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/finance/profit"
          element={
            <ProtectedRoute>
              <ProfitReportPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/quotes/:id/compare"
          element={
            <ProtectedRoute>
              <QuoteDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings/users"
          element={
            <ProtectedRoute>
              <div className="p-6 text-center text-slate-500">用户管理页面开发中...</div>
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}
