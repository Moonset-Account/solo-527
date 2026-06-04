import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, Dumbbell, Package, UsersRound, CalendarCheck,
  Snowflake, Activity, Bell, Filter, ScrollText, Calendar, TrendingUp,
  LogOut, Menu, X, Dumbbell as LogoIcon,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useMessageStore } from '@/stores/messageStore';

const iconMap: Record<string, React.ElementType> = {
  LayoutDashboard, Users, Dumbbell, Package, UsersRound, CalendarCheck,
  Snowflake, Activity, Bell, Filter, ScrollText, Calendar, TrendingUp,
};

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, navItems, logout } = useAuthStore();
  const { unreadCount, fetchUnreadCount } = useMessageStore();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getPageTitle = () => {
    const item = navItems.find((n) => location.pathname.startsWith(n.path));
    return item?.label || 'FIT PRO';
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <aside
        className={`${sidebarOpen ? 'w-60' : 'w-0 overflow-hidden'} bg-primary text-white flex flex-col transition-all duration-300 flex-shrink-0`}
      >
        <div className="flex items-center gap-2 px-6 py-5 border-b border-white/10">
          <LogoIcon className="w-7 h-7 text-accent" />
          <span className="text-xl font-bold tracking-wide">FIT PRO</span>
        </div>
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = iconMap[item.icon] || LayoutDashboard;
            const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
            return (
              <div
                key={item.path}
                onClick={() => navigate(item.path)}
                className={isActive ? 'nav-item-active' : 'nav-item'}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </div>
            );
          })}
        </nav>
        <div className="border-t border-white/10 px-4 py-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-accent/20 flex items-center justify-center text-accent font-semibold text-sm">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{user?.name}</div>
              <div className="text-xs text-gray-400">{user?.role}</div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-gray-400 hover:text-white text-sm w-full px-2 py-1.5 rounded transition-colors"
          >
            <LogOut className="w-4 h-4" />
            退出登录
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6 flex-shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-gray-500 hover:text-gray-700">
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <h1 className="text-lg font-semibold text-gray-800">{getPageTitle()}</h1>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/messages')}
              className="relative text-gray-500 hover:text-gray-700"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-danger text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            <div className="w-8 h-8 rounded-full bg-accent text-white flex items-center justify-center text-sm font-semibold">
              {user?.name?.charAt(0) || 'U'}
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
