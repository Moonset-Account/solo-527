import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import { UserRole } from '../types';

interface Props {
  children: React.ReactNode;
  roles?: UserRole[];
}

export default function ProtectedRoute({ children, roles }: Props) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles && user && !roles.includes(user.role)) {
    if (user.role === 'Student') {
      return <Navigate to="/my/schedule" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
