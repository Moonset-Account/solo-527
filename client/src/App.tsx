import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from 'react';
import { Spin } from 'antd';
import Login from "@/pages/Login";
import UserLayout from "@/layout/UserLayout";
import AdminLayout from "@/layout/AdminLayout";
import PluginMarket from "@/pages/user/PluginMarket";
import MyLicenses from "@/pages/user/MyLicenses";
import Applications from "@/pages/user/Applications";
import Approvals from "@/pages/admin/Approvals";
import Pricing from "@/pages/admin/Pricing";
import Reports from "@/pages/admin/Reports";
import Settlement from "@/pages/admin/Settlement";
import Trials from "@/pages/admin/Trials";
import Users from "@/pages/admin/Users";
import useUserStore from "@/store/user";
import type { UserRole } from "@/types";

function RequireAuth({ children, roles }: { children: JSX.Element; roles?: UserRole[] }) {
  const { user, token, fetchUser } = useUserStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      if (token && !user) {
        try {
          await fetchUser();
        } catch (err) {
          console.error(err);
        }
      }
      setLoading(false);
    };
    init();
  }, [token, user, fetchUser]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (roles && user && !roles.includes(user.role)) {
    if (user.role === 'USER') {
      return <Navigate to="/user/plugins" replace />;
    } else {
      return <Navigate to="/admin/approvals" replace />;
    }
  }

  return children;
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route
          path="/user"
          element={
            <RequireAuth roles={['USER', 'OP_ADMIN', 'FIN_ADMIN', 'SYS_ADMIN']}>
              <UserLayout />
            </RequireAuth>
          }
        >
          <Route index element={<Navigate to="plugins" replace />} />
          <Route path="plugins" element={<PluginMarket />} />
          <Route path="licenses" element={<MyLicenses />} />
          <Route path="applications" element={<Applications />} />
        </Route>

        <Route
          path="/admin"
          element={
            <RequireAuth roles={['OP_ADMIN', 'FIN_ADMIN', 'SYS_ADMIN']}>
              <AdminLayout />
            </RequireAuth>
          }
        >
          <Route index element={<Navigate to="approvals" replace />} />
          <Route path="approvals" element={<Approvals />} />
          <Route path="pricing" element={<Pricing />} />
          <Route path="reports" element={<Reports />} />
          <Route path="settlement" element={<Settlement />} />
          <Route path="trials" element={<Trials />} />
          <Route path="users" element={<Users />} />
        </Route>

        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}
