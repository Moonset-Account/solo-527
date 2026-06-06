import { Outlet, useNavigate } from '@remix-run/react';
import { useEffect } from 'react';
import { AuthProvider, useAuth } from '~/utils/auth';
import { Layout } from '~/components/Layout';

function AppContent() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="loading">
        <div>加载中...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <Layout>
      <Outlet />
    </Layout>
  );
}

export default function AppLayout() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
