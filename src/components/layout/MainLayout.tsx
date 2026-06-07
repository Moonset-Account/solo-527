import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import DataQualityBanner from './DataQualityBanner';
import { useUIStore } from '@/store';

export default function MainLayout() {
  const { sidebarCollapsed } = useUIStore();

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <div 
        className={`transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'ml-64'}`}
      >
        <Header />
        <DataQualityBanner />
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
