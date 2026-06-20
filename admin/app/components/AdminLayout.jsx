import { useEffect } from 'react';
import { useNavigate } from '@remix-run/react';
import { useAuth } from '~/utils/auth';
import Sidebar from './Sidebar';

export default function AdminLayout({ children, title }) {
  const { isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, loading, navigate]);
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return null;
  }
  
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 ml-64">
        <header className="bg-white shadow-sm border-b border-gray-200 py-4 px-6">
          <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
        </header>
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
