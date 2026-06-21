'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  ClipboardCheck,
  Settings,
  Users,
  CalendarClock,
  Tag,
  ChevronLeft,
  ChevronRight,
  LogOut,
  User,
  Menu,
  X,
} from 'lucide-react';
import { cn, getRoleColor, getStatusText } from '@/lib/utils';
import type { Role } from '@prisma/client';
import { Badge } from '@/components/ui/Badge';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  isMobileOpen: boolean;
  onMobileClose: () => void;
}

interface PermEntry {
  id?: string;
  role: string;
  resource: string;
  action: string;
}

const menuItems = [
  {
    title: '驾驶舱',
    href: '/',
    icon: LayoutDashboard,
    resource: 'dashboard',
    action: 'view',
  },
  {
    title: '订单管理',
    href: '/orders',
    icon: ShoppingCart,
    resource: 'orders',
    action: 'view',
    children: [
      { title: '订单列表', href: '/orders', resource: 'orders', action: 'view' },
      { title: '新建订单', href: '/orders/new', resource: 'orders', action: 'create' },
      { title: '交付追踪', href: '/delivery', resource: 'orders', action: 'view' },
    ],
  },
  {
    title: '客户价目表',
    href: '/price-list',
    icon: Tag,
    resource: 'price-list',
    action: 'view',
  },
  {
    title: '配件管理',
    href: '/parts',
    icon: Package,
    resource: 'parts',
    action: 'view',
    children: [
      { title: '配件档案', href: '/parts', resource: 'parts', action: 'view' },
      { title: '库存周转', href: '/parts/inventory', resource: 'inventory', action: 'view' },
      { title: '出入库记录', href: '/parts/in-out', resource: 'inventory', action: 'view' },
    ],
  },
  {
    title: '质检管理',
    href: '/quality',
    icon: ClipboardCheck,
    resource: 'quality',
    action: 'view',
    children: [
      { title: '质检记录', href: '/quality', resource: 'quality', action: 'view' },
      { title: '不合格处理', href: '/quality/failed', resource: 'quality', action: 'view' },
    ],
  },
  {
    title: '系统配置',
    href: '/config/metrics',
    icon: Settings,
    resource: 'config',
    action: 'view',
    children: [
      { title: '指标口径', href: '/config/metrics', resource: 'config', action: 'view' },
      { title: '角色权限', href: '/config/permissions', resource: 'config', action: 'edit' },
      { title: '用户管理', href: '/config/users', resource: 'users', action: 'view' },
    ],
  },
];

export function Sidebar({ collapsed, onToggle, isMobileOpen, onMobileClose }: SidebarProps) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['订单管理', '配件管理', '质检管理', '系统配置']);
  const [dbPermissions, setDbPermissions] = useState<PermEntry[]>([]);

  const role = (session?.user?.role as Role) || 'reception';

  useEffect(() => {
    async function loadPermissions() {
      if (role === 'admin') return;
      try {
        const res = await fetch('/api/permissions');
        if (res.ok) {
          const data = await res.json();
          setDbPermissions(data);
        }
      } catch {
      }
    }
    loadPermissions();
  }, [role]);

  const checkPermission = (resource: string, action: string): boolean => {
    if (role === 'admin') return true;
    if (dbPermissions.length > 0) {
      return dbPermissions.some(
        (p) => p.role === role && (p.resource === resource || p.resource === '*') && (p.action === action || p.action === '*')
      );
    }
    return false;
  };

  const visibleMenuItems = menuItems.filter((item) =>
    checkPermission(item.resource, item.action)
  );

  const toggleMenu = (title: string) => {
    setExpandedMenus((prev) =>
      prev.includes(title) ? prev.filter((m) => m !== title) : [...prev, title]
    );
  };

  const handleNavigation = (href: string) => {
    router.push(href);
    onMobileClose();
  };

  return (
    <>
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onMobileClose}
        />
      )}

      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-full bg-gradient-to-b from-industrial-dark to-industrial-dark/95',
          'transition-all duration-300 ease-in-out',
          'flex flex-col',
          collapsed ? 'w-20' : 'w-64',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="h-16 flex items-center justify-between px-4 border-b border-white/10">
          {!collapsed && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shadow-glow">
                <Package className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-white font-bold text-base">汽配驾驶舱</h1>
                <p className="text-white/50 text-xs">Auto Parts Cockpit</p>
              </div>
            </div>
          )}
          {collapsed && (
            <div className="w-full flex justify-center">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
                <Package className="w-5 h-5 text-white" />
              </div>
            </div>
          )}
          <button
            onClick={onToggle}
            className="hidden lg:flex w-8 h-8 items-center justify-center rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
          <button
            onClick={onMobileClose}
            className="lg:hidden w-8 h-8 flex items-center justify-center rounded-lg text-white/60 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {visibleMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.children
              ? item.children.some((child) => pathname === child.href)
              : pathname === item.href;
            const isExpanded = expandedMenus.includes(item.title);
            const hasChildren = item.children && item.children.length > 0;
            const visibleChildren = item.children?.filter((child) =>
              checkPermission(child.resource, child.action)
            );

            return (
              <div key={item.title}>
                <button
                  onClick={() => hasChildren ? toggleMenu(item.title) : handleNavigation(item.href)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-left',
                    'group',
                    isActive && !hasChildren
                      ? 'bg-white/15 text-white shadow-lg'
                      : 'text-white/70 hover:text-white hover:bg-white/10',
                    collapsed && 'justify-center'
                  )}
                >
                  <Icon className={cn('w-5 h-5 flex-shrink-0', isActive && 'text-primary-300')} />
                  {!collapsed && (
                    <>
                      <span className="text-sm font-medium flex-1">{item.title}</span>
                      {hasChildren && (
                        <ChevronRight
                          className={cn(
                            'w-4 h-4 transition-transform duration-200',
                            isExpanded && 'rotate-90'
                          )}
                        />
                      )}
                    </>
                  )}
                </button>

                {hasChildren && isExpanded && !collapsed && visibleChildren && visibleChildren.length > 0 && (
                  <div className="mt-1 ml-4 pl-4 border-l border-white/10 space-y-1">
                    {visibleChildren.map((child) => (
                      <button
                        key={child.href}
                        onClick={() => handleNavigation(child.href)}
                        className={cn(
                          'w-full text-left px-3 py-2 rounded-md text-sm transition-colors',
                          pathname === child.href
                            ? 'text-primary-300 bg-white/5 font-medium'
                            : 'text-white/50 hover:text-white/80 hover:bg-white/5'
                        )}
                      >
                        {child.title}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <div className="border-t border-white/10 p-3">
          {session?.user ? (
            <div className={cn('flex items-center', collapsed ? 'justify-center' : 'gap-3')}>
              <div className={cn(
                'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0',
                'bg-gradient-to-br from-primary-400 to-primary-600 text-white font-medium'
              )}>
                <User className="w-5 h-5" />
              </div>
              {!collapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{session.user.name}</p>
                  <Badge className={cn(getRoleColor(session.user.role), 'text-xs px-2 py-0.5')}>
                    {getStatusText(session.user.role)}
                  </Badge>
                </div>
              )}
              {!collapsed && (
                <button
                  onClick={() => signOut()}
                  className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
                  title="退出登录"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              )}
            </div>
          ) : (
            !collapsed && (
              <button
                onClick={() => router.push('/login')}
                className="w-full py-2 text-sm text-white/70 hover:text-white"
              >
                登录
              </button>
            )
          )}
        </div>
      </aside>
    </>
  );
}

interface HeaderProps {
  onMenuClick: () => void;
  title: string;
}

export function Header({ onMenuClick, title }: HeaderProps) {
  const { data: session } = useSession();

  return (
    <header className="h-16 bg-white border-b border-metal-200 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-lg hover:bg-metal-100 text-metal-600"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-lg font-semibold text-metal-900">{title}</h2>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {session?.user && (
          <div className="flex items-center gap-3">
            <span className="text-sm text-metal-600 hidden sm:block">
              欢迎回来，{session.user.name}
            </span>
          </div>
        )}
      </div>
    </header>
  );
}
