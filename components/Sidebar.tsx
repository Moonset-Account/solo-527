'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';
import {
  LayoutDashboard,
  BarChart3,
  Settings,
  Users,
  Building2,
  Bell,
  LogOut,
  ChevronRight,
  CalendarCheck,
  ListTodo,
  History,
} from 'lucide-react';
import Avatar from './Avatar';
import { cn } from '@/lib/utils';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const currentUser = useStore((state) => state.currentUser);
  const logout = useStore((state) => state.logout);

  const handleLogout = () => {
    logout();
    router.push('/login');
    router.refresh();
  };

  const mainNav = [
    { name: '看板首页', href: '/', icon: LayoutDashboard },
    { name: '统计分析', href: '/statistics', icon: BarChart3 },
  ];

  const adminNav = [
    { name: '事项配置', href: '/admin/tasks', icon: ListTodo },
    { name: '催办规则', href: '/admin/rules', icon: Bell },
    { name: '用户管理', href: '/admin/users', icon: Users },
    { name: '审计日志', href: '/admin/audit', icon: History },
    { name: '系统设置', href: '/admin/settings', icon: Settings },
  ];

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  const NavLink = ({ item }: { item: { name: string; href: string; icon: any } }) => (
    <Link
      href={item.href}
      onClick={onClose}
      className={cn(
        'sidebar-link group',
        isActive(item.href) ? 'sidebar-link-active' : 'sidebar-link-inactive'
      )}
    >
      <item.icon className="w-5 h-5 mr-3" />
      <span className="flex-1">{item.name}</span>
      <ChevronRight className={cn('w-4 h-4 transition-transform', isActive(item.href) ? 'opacity-100' : 'opacity-0 group-hover:opacity-50')} />
    </Link>
  );

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          'fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 flex flex-col transition-transform duration-300 ease-in-out',
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="p-4 border-b border-gray-200">
          <Link href="/" className="flex items-center gap-3" onClick={onClose}>
            <div className="w-10 h-10 bg-primary-900 rounded-xl flex items-center justify-center">
              <CalendarCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-gray-900">周会看板</h1>
              <p className="text-xs text-gray-500">Weekly Meeting</p>
            </div>
          </Link>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto scrollbar-thin">
          <div className="mb-2 px-3">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              主菜单
            </p>
          </div>
          {mainNav.map((item) => (
            <NavLink key={item.href} item={item} />
          ))}

          {currentUser?.role === 'admin' && (
            <>
              <div className="my-4 px-3 pt-4 border-t border-gray-100">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  系统管理
                </p>
              </div>
              {adminNav.map((item) => (
                <NavLink key={item.href} item={item} />
              ))}
            </>
          )}

          {(currentUser?.role === 'admin' || currentUser?.role === 'manager') && (
            !pathname.startsWith('/admin') && (
              <Link
                href="/admin/rules"
                onClick={onClose}
                className="sidebar-link sidebar-link-inactive mt-4"
              >
                <Bell className="w-5 h-5 mr-3" />
                <span>催办规则配置</span>
              </Link>
            )
          )}
        </nav>

        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center gap-3 mb-3">
            <Avatar name={currentUser?.name || ''} size="md" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {currentUser?.name}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {currentUser?.role === 'admin' ? '系统管理员' : currentUser?.role === 'manager' ? '部门主管' : '普通用户'}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full btn-secondary text-sm justify-center"
          >
            <LogOut className="w-4 h-4 mr-2" />
            退出登录
          </button>
        </div>
      </aside>
    </>
  );
}
