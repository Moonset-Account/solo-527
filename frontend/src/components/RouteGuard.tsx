import { Navigate } from 'react-router-dom';
import { useAuth } from '@/store/authStore';
import type { UserRole } from '@/types';

interface RouteGuardProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
}

export default function RouteGuard({ children, allowedRoles }: RouteGuardProps) {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return (
      <div style={{ padding: 48, textAlign: 'center' }}>
        <h1 style={{ fontSize: 72, color: '#ff4d4f' }}>403</h1>
        <p style={{ fontSize: 18, color: '#999' }}>您没有权限访问此页面</p>
        <a href="/login">返回登录</a>
      </div>
    );
  }

  return <>{children}</>;
}
