import { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import {
  LayoutDashboard,
  FolderKanban,
  DollarSign,
  Users,
  FileText,
  Bell,
  Menu,
  X,
  LogOut,
  User,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { cn, getRoleLabel } from '@/lib/utils';
import { useOfflineSync } from '@/hooks/useOfflineSync';

interface LayoutProps {
  children: React.ReactNode;
}

const navigation = [
  { name: '仪表盘', href: '/dashboard', icon: LayoutDashboard },
  { name: '项目看板', href: '/projects', icon: FolderKanban },
  { name: '预算跟踪', href: '/budget', icon: DollarSign },
  { name: '供应商', href: '/suppliers', icon: Users },
  { name: '文件审批', href: '/files', icon: FileText },
];

export default function Layout({ children }: LayoutProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { isOnline, pendingCount } = useOfflineSync();

  if (!session) {
    router.push('/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="lg:hidden">
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </div>

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
          <span className="text-lg font-bold text-primary-600">婚礼策划</span>
          <button
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="p-4 space-y-1">
          {navigation.map((item) => {
            const isActive = router.pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-100'
                )}
                onClick={() => setSidebarOpen(false)}
              >
                <Icon className="w-5 h-5 mr-3" />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 bg-white border-b border-gray-200 h-16 flex items-center px-4 lg:px-6">
          <button
            className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-gray-100"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-6 h-6" />
          </button>

          <div className="flex-1" />

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              {isOnline ? (
                <div className="flex items-center text-green-600 text-xs">
                  <Wifi className="w-4 h-4 mr-1" />
                  在线
                </div>
              ) : (
                <div className="flex items-center text-orange-600 text-xs">
                  <WifiOff className="w-4 h-4 mr-1" />
                  离线
                  {pendingCount > 0 && (
                    <span className="ml-1 px-1.5 py-0.5 bg-orange-100 rounded-full text-[10px]">
                      {pendingCount}
                    </span>
                  )}
                </div>
              )}
            </div>

            <button className="relative p-2 rounded-lg hover:bg-gray-100">
              <Bell className="w-5 h-5 text-gray-600" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            </button>

            <div className="relative">
              <button
                className="flex items-center space-x-3 p-1 rounded-lg hover:bg-gray-100"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
              >
                <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                  <User className="w-4 h-4 text-primary-600" />
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-medium text-gray-900">
                    {session.user?.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {getRoleLabel(session.user?.role || '')}
                  </p>
                </div>
              </button>

              {userMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setUserMenuOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                    <button
                      onClick={() => {
                        signOut();
                        setUserMenuOpen(false);
                      }}
                      className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <LogOut className="w-4 h-4 mr-3" />
                      退出登录
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        <main className="p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
