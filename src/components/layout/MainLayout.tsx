import { Outlet } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import Sidebar from './Sidebar';
import Header from './Header';
import { useAppStore } from '@/store';
import { cn } from '@/lib/utils';

export default function MainLayout() {
  const isLoading = useAppStore((state) => state.isLoading);

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className={cn(
          'flex-1 overflow-auto p-6 relative',
          isLoading && 'pointer-events-none'
        )}>
          {isLoading && (
            <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center z-50">
              <div className="flex items-center gap-3 text-gray-600">
                <Loader2 className="w-6 h-6 animate-spin" />
                <span className="text-sm font-medium">加载中...</span>
              </div>
            </div>
          )}
          <Outlet />
        </main>
      </div>
    </div>
  );
}
