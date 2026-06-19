import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  Calendar,
  Shield,
  Settings,
  Bell,
  Activity,
  ChevronLeft,
  ChevronRight,
  FlaskConical,
  Tag,
  Wrench,
  FileCheck,
  AlertTriangle,
} from 'lucide-react';
import { useAppStore } from '@/store';
import { UserRole } from '@/types';
import { cn } from '@/lib/utils';

interface MenuItem {
  path: string;
  label: string;
  icon: React.ElementType;
  roles: UserRole[];
  children?: MenuItem[];
}

const menuItems: MenuItem[] = [
  {
    path: '/dashboard',
    label: '首页仪表板',
    icon: LayoutDashboard,
    roles: ['RESEARCHER', 'ADMIN', 'DEVICE_TEACHER', 'PRINCIPAL'],
  },
  {
    path: '/application',
    label: '领用申请',
    icon: FileText,
    roles: ['RESEARCHER', 'ADMIN', 'DEVICE_TEACHER', 'PRINCIPAL'],
  },
  {
    path: '/schedule',
    label: '排期管理',
    icon: Calendar,
    roles: ['RESEARCHER', 'ADMIN', 'DEVICE_TEACHER', 'PRINCIPAL'],
    children: [
      { path: '/schedule/calendar', label: '日历视图', icon: Calendar, roles: ['RESEARCHER', 'ADMIN', 'DEVICE_TEACHER', 'PRINCIPAL'] },
      { path: '/schedule/conflicts', label: '冲突处理', icon: AlertTriangle, roles: ['ADMIN', 'DEVICE_TEACHER', 'PRINCIPAL'] },
    ],
  },
  {
    path: '/compliance',
    label: '安全合规',
    icon: Shield,
    roles: ['ADMIN', 'DEVICE_TEACHER', 'PRINCIPAL'],
  },
  {
    path: '/config',
    label: '配置中心',
    icon: Settings,
    roles: ['ADMIN'],
    children: [
      { path: '/config/reagents', label: '试剂配置', icon: FlaskConical, roles: ['ADMIN'] },
      { path: '/config/labels', label: '标签配置', icon: Tag, roles: ['ADMIN'] },
      { path: '/config/maintenance', label: '设备维护', icon: Wrench, roles: ['ADMIN'] },
      { path: '/config/audit', label: '审计日志', icon: FileCheck, roles: ['ADMIN'] },
    ],
  },
  {
    path: '/notifications',
    label: '通知中心',
    icon: Bell,
    roles: ['RESEARCHER', 'ADMIN', 'DEVICE_TEACHER', 'PRINCIPAL'],
    children: [
      { path: '/notifications/failures', label: '发送失败', icon: AlertTriangle, roles: ['ADMIN'] },
    ],
  },
  {
    path: '/tracking',
    label: '样本追踪',
    icon: Activity,
    roles: ['RESEARCHER', 'ADMIN', 'DEVICE_TEACHER', 'PRINCIPAL'],
  },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);
  const location = useLocation();
  const user = useAppStore((state) => state.user);

  const toggleExpand = (path: string) => {
    setExpandedMenus((prev) =>
      prev.includes(path) ? prev.filter((p) => p !== path) : [...prev, path]
    );
  };

  const isVisible = (item: MenuItem) => {
    if (!user) return false;
    return item.roles.includes(user.role);
  };

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const visibleItems = menuItems.filter(isVisible);

  return (
    <aside
      className={cn(
        'flex flex-col bg-white border-r border-gray-200 transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
        {!collapsed && (
          <span className="text-lg font-semibold text-gray-900">试剂管理系统</span>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="w-5 h-5 text-gray-500" />
          ) : (
            <ChevronLeft className="w-5 h-5 text-gray-500" />
          )}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-3">
          {visibleItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.children ? item.children[0].path : item.path}
                onClick={() => item.children && !collapsed && toggleExpand(item.path)}
                className={({ isActive: navActive }) =>
                  cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
                    isActive(item.path) || navActive
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-600 hover:bg-gray-100',
                    collapsed && 'justify-center'
                  )
                }
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
              </NavLink>

              {!collapsed && item.children && expandedMenus.includes(item.path) && (
                <ul className="mt-1 ml-4 space-y-1 border-l-2 border-gray-100">
                  {item.children.filter(isVisible).map((child) => (
                    <li key={child.path}>
                      <NavLink
                        to={child.path}
                        className={({ isActive: navActive }) =>
                          cn(
                            'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                            navActive
                              ? 'text-blue-600 bg-blue-50'
                              : 'text-gray-500 hover:bg-gray-100'
                          )
                        }
                      >
                        <child.icon className="w-4 h-4 flex-shrink-0" />
                        <span>{child.label}</span>
                      </NavLink>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
