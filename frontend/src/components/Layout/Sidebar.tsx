import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Ticket,
  BookOpen,
  BarChart3,
  Settings,
  Users,
  CheckCircle2,
  TrendingUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUser } from '@/store/authStore';

interface MenuItem {
  path: string;
  label: string;
  icon: React.ReactNode;
  roles?: string[];
  children?: MenuItem[];
}

const menuItems: MenuItem[] = [
  {
    path: '/',
    label: '仪表盘',
    icon: <LayoutDashboard className="h-5 w-5" />,
  },
  {
    path: '/tickets',
    label: '工单管理',
    icon: <Ticket className="h-5 w-5" />,
  },
  {
    path: '/knowledge',
    label: '知识库',
    icon: <BookOpen className="h-5 w-5" />,
  },
  {
    path: '/operations',
    label: '运营管理',
    icon: <Settings className="h-5 w-5" />,
    roles: ['admin', 'agent'],
    children: [
      { path: '/operations/service', label: '客服工单', icon: <Users className="h-4 w-4" /> },
      { path: '/operations/quality', label: '会话质检', icon: <CheckCircle2 className="h-4 w-4" /> },
      { path: '/operations/improvement', label: '改进动作', icon: <TrendingUp className="h-4 w-4" /> },
    ],
  },
  {
    path: '/reports',
    label: '统计报表',
    icon: <BarChart3 className="h-5 w-5" />,
    roles: ['admin', 'agent'],
  },
];

export function Sidebar() {
  const location = useLocation();
  const user = useUser();

  const hasAccess = (item: MenuItem) => {
    if (!item.roles) return true;
    if (!user) return false;
    return item.roles.includes(user.role);
  };

  const filteredMenuItems = menuItems.filter(hasAccess);

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  const isChildActive = (children?: MenuItem[]) => {
    if (!children) return false;
    return children.some((child) => location.pathname.startsWith(child.path));
  };

  return (
    <aside className="w-64 bg-white border-r border-zinc-200 flex flex-col h-screen sticky top-0">
      <div className="h-16 flex items-center px-6 border-b border-zinc-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
            <Ticket className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-zinc-900">售后工单中心</h1>
            <p className="text-xs text-zinc-500">After Sales Service</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 overflow-y-auto scrollbar-hide">
        <ul className="space-y-1">
          {filteredMenuItems.map((item) => (
            <li key={item.path}>
              {item.children ? (
                <div className="space-y-1">
                  <div
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors',
                      isChildActive(item.children)
                        ? 'text-primary-600 bg-primary-50'
                        : 'text-zinc-700 hover:bg-zinc-100'
                    )}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </div>
                  <ul className="ml-8 space-y-1">
                    {item.children.map((child) => (
                      <li key={child.path}>
                        <NavLink
                          to={child.path}
                          className={({ isActive }) =>
                            cn(
                              'flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors',
                              isActive
                                ? 'text-primary-600 bg-primary-50'
                                : 'text-zinc-600 hover:bg-zinc-50'
                            )
                          }
                        >
                          {child.icon}
                          <span>{child.label}</span>
                        </NavLink>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <NavLink
                  to={item.path}
                  end={item.path === '/'}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors',
                    isActive(item.path)
                      ? 'text-primary-600 bg-primary-50'
                      : 'text-zinc-700 hover:bg-zinc-100'
                  )}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </NavLink>
              )}
            </li>
          ))}
        </ul>
      </nav>

      <div className="p-4 border-t border-zinc-200">
        <div className="bg-zinc-50 rounded-lg p-3">
          <p className="text-xs text-zinc-500">当前版本</p>
          <p className="text-sm font-medium text-zinc-700">v1.0.0</p>
        </div>
      </div>
    </aside>
  );
}
