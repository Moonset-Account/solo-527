import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import {
  Home, BookOpen, Calendar, ClipboardList, UserCheck,
  Package, BarChart3, LayoutDashboard, Bell, FileText,
  Users, LogOut, ChevronRight, Shield, Clock,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useNotificationStore } from '@/stores/notificationStore';
import type { UserRole } from '@/types';

interface NavItem {
  label: string;
  icon: React.ReactNode;
  path: string;
  group?: string;
}

const roleNavItems: Record<UserRole, NavItem[]> = {
  admin: [
    { label: '工作台', icon: <Home size={18} />, path: '/dashboard', group: '概览' },
    { label: '课程管理', icon: <BookOpen size={18} />, path: '/courses', group: '业务管理' },
    { label: '场次管理', icon: <Calendar size={18} />, path: '/sessions', group: '业务管理' },
    { label: '排班管理', icon: <ClipboardList size={18} />, path: '/scheduling', group: '业务管理' },
    { label: '教具管理', icon: <Package size={18} />, path: '/teaching-aids', group: '业务管理' },
    { label: '反馈统计', icon: <BarChart3 size={18} />, path: '/feedback/stats', group: '数据与系统' },
    { label: '后台看板', icon: <LayoutDashboard size={18} />, path: '/kanban', group: '数据与系统' },
    { label: '通知中心', icon: <Bell size={18} />, path: '/notifications', group: '数据与系统' },
    { label: '审计日志', icon: <FileText size={18} />, path: '/audit-logs', group: '数据与系统' },
    { label: '用户管理', icon: <Users size={18} />, path: '/admin/users', group: '数据与系统' },
  ],
  manager: [
    { label: '工作台', icon: <Home size={18} />, path: '/dashboard', group: '概览' },
    { label: '课程管理', icon: <BookOpen size={18} />, path: '/courses', group: '业务管理' },
    { label: '场次管理', icon: <Calendar size={18} />, path: '/sessions', group: '业务管理' },
    { label: '审核中心', icon: <Shield size={18} />, path: '/review', group: '业务管理' },
    { label: '排班管理', icon: <ClipboardList size={18} />, path: '/scheduling', group: '业务管理' },
    { label: '教具管理', icon: <Package size={18} />, path: '/teaching-aids', group: '业务管理' },
    { label: '反馈统计', icon: <BarChart3 size={18} />, path: '/feedback/stats', group: '数据与系统' },
    { label: '后台看板', icon: <LayoutDashboard size={18} />, path: '/kanban', group: '数据与系统' },
    { label: '通知中心', icon: <Bell size={18} />, path: '/notifications', group: '数据与系统' },
  ],
  guide: [
    { label: '工作台', icon: <Home size={18} />, path: '/dashboard', group: '概览' },
    { label: '我的排班', icon: <ClipboardList size={18} />, path: '/my-schedule', group: '工作' },
    { label: '签到核验', icon: <UserCheck size={18} />, path: '/checkin', group: '工作' },
    { label: '课后反馈', icon: <BarChart3 size={18} />, path: '/feedback', group: '工作' },
    { label: '通知中心', icon: <Bell size={18} />, path: '/notifications', group: '工作' },
  ],
  school_contact: [
    { label: '工作台', icon: <Home size={18} />, path: '/dashboard', group: '概览' },
    { label: '课程浏览', icon: <BookOpen size={18} />, path: '/courses', group: '报名' },
    { label: '团体报名', icon: <Users size={18} />, path: '/booking/group', group: '报名' },
    { label: '我的报名', icon: <ClipboardList size={18} />, path: '/my-bookings', group: '报名' },
    { label: '通知中心', icon: <Bell size={18} />, path: '/notifications', group: '报名' },
  ],
  parent: [
    { label: '工作台', icon: <Home size={18} />, path: '/dashboard', group: '概览' },
    { label: '课程浏览', icon: <BookOpen size={18} />, path: '/courses', group: '报名' },
    { label: '散客报名', icon: <UserCheck size={18} />, path: '/booking/individual', group: '报名' },
    { label: '我的报名', icon: <ClipboardList size={18} />, path: '/my-bookings', group: '报名' },
    { label: '课后反馈', icon: <BarChart3 size={18} />, path: '/feedback', group: '报名' },
    { label: '通知中心', icon: <Bell size={18} />, path: '/notifications', group: '报名' },
  ],
};

const roleLabels: Record<UserRole, string> = {
  admin: '系统管理员',
  manager: '场馆管理',
  guide: '讲解员',
  school_contact: '学校联系人',
  parent: '家长',
};

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { unreadCount, refreshUnreadCount } = useNotificationStore();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    refreshUnreadCount();
  }, [refreshUnreadCount]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  if (!user) return null;

  const navItems = roleNavItems[user.role] || [];

  const breadcrumbs = () => {
    const current = navItems.find((item) => location.pathname.startsWith(item.path));
    if (!current) return '工作台';
    return current.label;
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const formatDateTime = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}/${month}/${day} ${hours}:${minutes}`;
  };

  const groupedNavItems = navItems.reduce<{ group: string; items: NavItem[] }[]>((acc, item) => {
    const groupName = item.group || '';
    const existing = acc.find((g) => g.group === groupName);
    if (existing) {
      existing.items.push(item);
    } else {
      acc.push({ group: groupName, items: [item] });
    }
    return acc;
  }, []);

  return (
    <div className="flex h-screen bg-ivory">
      <aside className="w-60 bg-museum-radial flex flex-col shrink-0">
        <div className="gold-accent-line" />

        <div className="h-16 flex items-center px-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-gold flex items-center justify-center">
              <BookOpen size={18} className="text-museum-dark" />
            </div>
            <span className="text-xl font-serif font-bold text-white">博研通</span>
          </div>
        </div>

        <div className="mx-4 gold-accent-line opacity-40" />

        <nav className="flex-1 py-3 px-3 overflow-y-auto">
          {groupedNavItems.map((group, groupIdx) => (
            <div key={group.group}>
              {groupIdx > 0 && (
                <div className="mx-2 my-2">
                  <div className="gold-accent-line opacity-20" />
                </div>
              )}
              {groupIdx > 0 && group.group && (
                <p className="px-3 mb-1.5 text-[10px] font-medium tracking-wider text-museum-50/30 uppercase">
                  {group.group}
                </p>
              )}
              {group.items.map((item) => {
                const isActive = location.pathname === item.path || (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
                return (
                  <button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-r-md mb-0.5 text-sm transition-all duration-200 border-l-2 ${
                      isActive
                        ? 'border-l-gold bg-white/10 text-white'
                        : 'border-l-transparent text-museum-50/60 hover:bg-white/5 hover:text-white hover:border-l-gold/30'
                    }`}
                  >
                    <span className={isActive ? 'text-gold' : ''}>{item.icon}</span>
                    <span>{item.label}</span>
                    {isActive && <ChevronRight size={14} className="ml-auto text-gold" />}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="p-4">
          <div className="gold-accent-line opacity-20 mb-4" />
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-gold/20 flex items-center justify-center text-gold font-medium text-sm ring-2 ring-gold/40 ring-offset-2 ring-offset-museum-dark">
              {user.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white truncate">{user.name}</p>
              <span className="inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] font-medium bg-gold/15 text-gold-light tracking-wide">
                {roleLabels[user.role]}
              </span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm text-museum-50/50 hover:bg-white/10 hover:text-white transition-all duration-200"
          >
            <LogOut size={16} />
            <span>退出登录</span>
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)] flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Home size={13} className="text-slate-300" />
            <span className="text-slate-300">·</span>
            <span className="text-museum font-medium">{breadcrumbs()}</span>
          </div>

          <div className="flex items-center gap-5">
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <Clock size={12} />
              <span>{formatDateTime(currentTime)}</span>
            </div>

            <button
              onClick={() => navigate('/notifications')}
              className="relative p-2 rounded-md hover:bg-gray-100 transition-colors"
            >
              <Bell size={18} className="text-slate-400" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center px-1">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-museum text-white flex items-center justify-center text-xs font-medium">
                {user.name.charAt(0)}
              </div>
              <span className="text-sm text-slate-700">{user.name}</span>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <div className="page-enter">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
