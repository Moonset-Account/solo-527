import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { ConfigProvider } from "antd";
import zhCN from "antd/locale/zh_CN";
import Layout from "@/components/Layout";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Alerts from "@/pages/Alerts";
import AlertDetail from "@/pages/AlertDetail";
import AccountRequests from "@/pages/AccountRequests";
import AccountRequestNew from "@/pages/AccountRequestNew";
import AccountRequestDetail from "@/pages/AccountRequestDetail";
import Inspections from "@/pages/Inspections";
import InspectionDetail from "@/pages/InspectionDetail";
import Duty from "@/pages/Duty";
import Records from "@/pages/Records";
import Reports from "@/pages/Reports";
import AuditLogs from "@/pages/AuditLogs";

const theme = {
  token: {
    colorPrimary: "#1A365D",
    borderRadius: 6,
    colorSuccess: "#38A169",
    colorWarning: "#ECC94B",
    colorError: "#E53E3E",
    colorInfo: "#38B2AC",
  },
};

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem("token");
  return token ? <Layout>{children}</Layout> : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <ConfigProvider theme={theme} locale={zhCN}>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/alerts" element={<PrivateRoute><Alerts /></PrivateRoute>} />
          <Route path="/alerts/:id" element={<PrivateRoute><AlertDetail /></PrivateRoute>} />
          <Route path="/account-requests" element={<PrivateRoute><AccountRequests /></PrivateRoute>} />
          <Route path="/account-requests/new" element={<PrivateRoute><AccountRequestNew /></PrivateRoute>} />
          <Route path="/account-requests/:id" element={<PrivateRoute><AccountRequestDetail /></PrivateRoute>} />
          <Route path="/inspections" element={<PrivateRoute><Inspections /></PrivateRoute>} />
          <Route path="/inspections/:id" element={<PrivateRoute><InspectionDetail /></PrivateRoute>} />
          <Route path="/duty" element={<PrivateRoute><Duty /></PrivateRoute>} />
          <Route path="/records" element={<PrivateRoute><Records /></PrivateRoute>} />
          <Route path="/reports" element={<PrivateRoute><Reports /></PrivateRoute>} />
          <Route path="/audit-logs" element={<PrivateRoute><AuditLogs /></PrivateRoute>} />
        </Routes>
      </Router>
    </ConfigProvider>
  );
}
