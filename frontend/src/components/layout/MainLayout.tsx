import { Outlet, Link, useLocation, useNavigate } from '@tanstack/react-router';
import { useAuthStore } from '@/store/auth';
import { useQuery } from '@tanstack/react-query';
import { notificationApi } from '@/api';
import {
  Music,
  Ticket,
  Home,
  User,
  LogOut,
  LayoutDashboard,
  FileCheck,
  RefreshCw,
  Calendar,
  Tag,
  Bell,
  ClipboardList,
  ChevronDown,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

export default function MainLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const { data: notifData, refetch: refetchNotif } = useQuery({
    queryKey: ['unread-notifications'],
    queryFn: () => user?.role !== 'audience' ? notificationApi.unreadCount() : Promise.resolve({ count: 0 }),
    enabled: !!user && user.role !== 'audience',
    refetchInterval: 30000,
  });

  const isAdmin = user?.role !== 'audience';
  const currentPath = location.pathname;

  const audienceNav: any[] = [
    { to: '/', icon: Home, label: '首页' },
    { to: '/concerts', icon: Music, label: '演出' },
    { to: '/my-orders', icon: Ticket, label: '我的订单' },
    { to: '/profile', icon: User, label: '个人中心' },
  ];

  const adminNav: any[] = [
    { to: '/admin', icon: LayoutDashboard, label: '工作台' },
    { to: '/admin/orders', icon: ClipboardList, label: '订单管理' },
    { to: '/admin/verifications', icon: FileCheck, label: '实名审核' },
    { to: '/admin/refunds', icon: RefreshCw, label: '退款处理' },
    { to: '/admin/shows', icon: Calendar, label: '场次座位' },
    { to: '/admin/tickets', icon: Tag, label: '票种库存' },
    { to: '/admin/attendance', icon: ClipboardList, label: '到场反馈' },
    { to: '/admin/notifications', icon: Bell, label: '异常提醒', badge: notifData?.count },
  ];

  const nav = (isAdmin ? adminNav : audienceNav).filter(Boolean);

  const handleLogout = () => {
    logout();
    navigate({ to: '/login' });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="lg:hidden">
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="p-2 rounded-md hover:bg-gray-100"
                >
                  <span className="sr-only">打开菜单</span>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              </div>
              <Link to="/" className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white">
                  <Music className="w-5 h-5" />
                </div>
                <span className="font-bold text-lg bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
                  票务系统
                </span>
              </Link>
            </div>

            <nav className="hidden lg:flex items-center gap-1">
              {nav.map((item) => {
                const Icon = item.icon;
                const active = item.to === '/' ? currentPath === '/' : currentPath.startsWith(item.to);
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={cn(
                      'px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 relative',
                      active
                        ? 'bg-primary-50 text-primary-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                    {item.badge ? (
                      <span className="ml-1 min-w-5 h-5 px-1.5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
                        {item.badge > 99 ? '99+' : item.badge}
                      </span>
                    ) : null}
                  </Link>
                );
              })}
            </nav>

            <div className="flex items-center gap-3 relative">
              {isAdmin && (
                <button
                  onClick={() => refetchNotif()}
                  className="relative p-2 rounded-lg hover:bg-gray-100"
                >
                  <Bell className="w-5 h-5 text-gray-600" />
                  {notifData?.count > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center">
                      {notifData.count > 9 ? '9+' : notifData.count}
                    </span>
                  )}
                </button>
              )}
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-100"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-sm font-semibold">
                    {user?.fullName?.[0] || 'U'}
                  </div>
                  <span className="hidden sm:block text-sm font-medium">{user?.fullName}</span>
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                </button>
                {showUserMenu && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowUserMenu(false)} />
                    <div className="absolute right-0 top-full mt-2 w-56 z-20 bg-white rounded-xl shadow-lg border border-gray-100 py-2">
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-sm font-semibold">{user?.fullName}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{user?.email}</p>
                        <span className={cn(
                          'inline-block mt-2 px-2 py-0.5 rounded-full text-xs font-medium',
                          user?.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                          user?.role === 'box_office' ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-700'
                        )}>
                          {user?.role === 'admin' ? '管理员' : user?.role === 'box_office' ? '票务员' : '观众'}
                        </span>
                      </div>
                      <button
                        onClick={() => { navigate({ to: '/profile' }); setShowUserMenu(false); }}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                      >
                        <User className="w-4 h-4" /> 个人中心
                      </button>
                      <button
                        onClick={handleLogout}
                        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                      >
                        <LogOut className="w-4 h-4" /> 退出登录
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {menuOpen && (
          <div className="lg:hidden border-t border-gray-200 bg-white">
            <div className="px-4 py-3 space-y-1">
              {nav.map((item) => {
                const Icon = item.icon;
                const active = item.to === '/' ? currentPath === '/' : currentPath.startsWith(item.to);
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setMenuOpen(false)}
                    className={cn(
                      'block px-3 py-2.5 rounded-lg text-sm font-medium flex items-center gap-3',
                      active ? 'bg-primary-50 text-primary-700' : 'text-gray-700 hover:bg-gray-100'
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="flex-1">{item.label}</span>
                    {item.badge ? (
                      <span className="min-w-5 h-5 px-1.5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
                        {item.badge > 99 ? '99+' : item.badge}
                      </span>
                    ) : null}
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Outlet />
      </main>
    </div>
  );
}
